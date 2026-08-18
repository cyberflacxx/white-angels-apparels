import { randomUUID } from "node:crypto";
import type { PoolClient, QueryResultRow } from "pg";
import { requirePool } from "../db/pool.js";
import { AppError } from "../middleware/error.js";
import { roundMoney } from "./orderService.js";

const HARARE_TIMEZONE = "Africa/Harare";
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PAGE_LIMIT = 100;
const DEFAULT_PAGE_LIMIT = 20;
const MAX_REPORT_RANGE_DAYS = 93;

type QueryRunner = Pick<PoolClient, "query">;
type PosItemInput = { productId: string; quantity: number };
type PosProductRow = {
  id: string;
  name: string;
  sku: string;
  price: string | number;
  stock_quantity: number;
  status: string;
  image_url: string | null;
};

export function getHarareToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: HARARE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export function normalizePosItems(items: PosItemInput[]) {
  if (!Array.isArray(items) || !items.length) {
    throw new AppError(400, "At least one sale item is required.");
  }

  const quantities = new Map<string, number>();
  for (const item of items) {
    if (!item?.productId) throw new AppError(400, "Each sale item must include a product.");
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new AppError(400, "Each sale item quantity must be a whole number of at least 1.");
    }
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  return Array.from(quantities.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

export function calculatePosTotals(items: Array<{ quantity: number; unitPrice: string | number }>) {
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = roundMoney(items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0));
  return { totalUnits, totalAmount };
}

export function parseDateRange({
  from,
  to,
  defaultToToday = false
}: {
  from?: string;
  to?: string;
  defaultToToday?: boolean;
}) {
  let fromDate = (from ?? "").trim();
  let toDate = (to ?? "").trim();

  if (!fromDate && !toDate && defaultToToday) {
    fromDate = getHarareToday();
    toDate = fromDate;
  } else if (fromDate && !toDate) {
    toDate = fromDate;
  } else if (!fromDate && toDate) {
    fromDate = toDate;
  }

  if (!fromDate || !toDate) throw new AppError(400, "Both from and to dates are required.");
  if (!DATE_ONLY.test(fromDate) || !DATE_ONLY.test(toDate)) throw new AppError(400, "Dates must use YYYY-MM-DD format.");
  if (fromDate > toDate) throw new AppError(400, "The from date must be on or before the to date.");

  const daySpan = differenceInUtcDays(fromDate, toDate) + 1;
  if (daySpan > MAX_REPORT_RANGE_DAYS) throw new AppError(400, "The selected date range is too large.");

  return { from: fromDate, to: toDate };
}

export function parsePagination(pageInput: string | undefined, limitInput: string | undefined) {
  const page = Math.max(1, Number.parseInt(pageInput || "1", 10) || 1);
  const requestedLimit = Number.parseInt(limitInput || String(DEFAULT_PAGE_LIMIT), 10) || DEFAULT_PAGE_LIMIT;
  const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, requestedLimit));
  return { page, limit, offset: (page - 1) * limit };
}

export async function listPosProducts(search = "") {
  const term = search.trim();
  const values: unknown[] = [];
  const conditions = ["p.status = 'ACTIVE'"];
  if (term) {
    values.push(`%${term}%`);
    conditions.push(`(p.name ilike $${values.length} or p.sku ilike $${values.length})`);
  }

  const result = await requirePool().query(
    `select
       p.id,
       p.name,
       p.sku,
       p.price as "sellingPrice",
       p.stock_quantity as "availableStock",
       p.status as "status",
       coalesce(pi.image_url, '/images/site/placeholder-product.jpg') as "primaryImage"
     from products p
     left join product_images pi on pi.product_id = p.id and pi.is_primary = true
     where ${conditions.join(" and ")}
     order by p.name asc`,
    values
  );

  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    sku: String(row.sku ?? ""),
    sellingPrice: Number(row.sellingPrice ?? 0),
    availableStock: Number(row.availableStock ?? 0),
    status: String(row.status ?? ""),
    primaryImage: String(row.primaryImage ?? "")
  }));
}

export async function recordPosSale(input: { clientReference: string; items: PosItemInput[] }, adminId: string) {
  if (!adminId) throw new AppError(401, "Admin authentication required.");
  if (!input.clientReference) throw new AppError(400, "clientReference is required.");

  const items = normalizePosItems(input.items);
  const client = await requirePool().connect();

  try {
    await client.query("begin");

    const existing = await client.query<{ id: string }>("select id from pos_sales where client_reference = $1 for update", [input.clientReference]);
    if (existing.rows[0]) {
      await client.query("commit");
      return getPosSaleById(existing.rows[0].id);
    }

    const products = await loadProductsForSale(client, items);
    const totals = calculatePosTotals(products.map((product) => ({ quantity: product.quantity, unitPrice: product.price })));
    const saleId = randomUUID();
    const saleNumber = await nextPosSaleNumber(client);
    const insertedSale = await client.query<{ sold_at: string }>(
      `insert into pos_sales (id, sale_number, client_reference, total_amount, total_units, created_by)
       values ($1, $2, $3, $4, $5, $6)
       returning sold_at`,
      [saleId, saleNumber, input.clientReference, totals.totalAmount.toFixed(2), totals.totalUnits, adminId]
    );

    for (const product of products) {
      const lineTotal = roundMoney(Number(product.price) * product.quantity);
      await client.query(
        `insert into pos_sale_items (id, sale_id, product_id, product_name, sku, quantity, unit_price, line_total)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [randomUUID(), saleId, product.id, product.name, product.sku, product.quantity, Number(product.price).toFixed(2), lineTotal.toFixed(2)]
      );

      const stockAfter = product.stock_quantity - product.quantity;
      await client.query("update products set stock_quantity = $1, updated_at = now() where id = $2", [stockAfter, product.id]);
      await client.query(
        `insert into inventory_movements (id, product_id, movement_type, quantity, stock_before, stock_after, reference, notes, created_by, created_at)
         values ($1, $2, 'SALE', $3, $4, $5, $6, $7, $8, now())`,
        [
          randomUUID(),
          product.id,
          -product.quantity,
          product.stock_quantity,
          stockAfter,
          saleNumber,
          "Stock deducted at POS sale recording.",
          adminId
        ]
      );
    }

    await client.query("commit");
    return getPosSaleById(saleId, insertedSale.rows[0]?.sold_at);
  } catch (error: any) {
    await client.query("rollback");
    if (error?.code === "23505") {
      const existing = await requirePool().query<{ id: string }>("select id from pos_sales where client_reference = $1", [input.clientReference]);
      if (existing.rows[0]) return getPosSaleById(existing.rows[0].id);
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function listPosSales(filters: { from?: string; to?: string; page?: string; limit?: string }) {
  const range = parseDateRange({ from: filters.from, to: filters.to, defaultToToday: true });
  const pagination = parsePagination(filters.page, filters.limit);
  const values: unknown[] = [range.from, range.to];

  const countResult = await requirePool().query<{ count: string }>(
    `select count(*)::text as count
     from pos_sales
     where date(timezone('${HARARE_TIMEZONE}', sold_at)) between $1::date and $2::date`,
    values
  );

  values.push(pagination.limit, pagination.offset);
  const rows = await requirePool().query(
    `select
       ps.id,
       ps.sale_number as "saleNumber",
       ps.client_reference as "clientReference",
       ps.sold_at as "soldAt",
       ps.total_amount as "totalAmount",
       ps.total_units as "totalUnits",
       a.full_name as "recordedBy"
     from pos_sales ps
     join admins a on a.id = ps.created_by
     where date(timezone('${HARARE_TIMEZONE}', ps.sold_at)) between $1::date and $2::date
     order by ps.sold_at desc, ps.created_at desc
     limit $3 offset $4`,
    values
  );

  return {
    range,
    page: pagination.page,
    limit: pagination.limit,
    total: Number(countResult.rows[0]?.count ?? 0),
    sales: rows.rows.map(mapPosSaleSummary)
  };
}

export async function getPosSaleById(identifier: string, soldAtHint?: string) {
  const result = await requirePool().query(
    `select
       ps.id,
       ps.sale_number as "saleNumber",
       ps.client_reference as "clientReference",
       ps.sold_at as "soldAt",
       ps.total_amount as "totalAmount",
       ps.total_units as "totalUnits",
       ps.created_at as "createdAt",
       a.id as "createdById",
       a.full_name as "recordedBy"
     from pos_sales ps
     join admins a on a.id = ps.created_by
     where ps.id::text = $1 or ps.sale_number = $1`,
    [identifier]
  );
  const sale = result.rows[0];
  if (!sale) throw new AppError(404, "POS sale not found.");

  const items = await requirePool().query(
    `select
       id,
       product_id as "productId",
       product_name as "productName",
       sku,
       quantity,
       unit_price as "unitPrice",
       line_total as "lineTotal",
       created_at as "createdAt"
     from pos_sale_items
     where sale_id = $1
     order by created_at asc`,
    [sale.id]
  );

  return {
    id: String(sale.id),
    saleNumber: String(sale.saleNumber),
    clientReference: String(sale.clientReference),
    soldAt: String(soldAtHint ?? sale.soldAt),
    totalAmount: Number(sale.totalAmount ?? 0),
    totalUnits: Number(sale.totalUnits ?? 0),
    recordedBy: String(sale.recordedBy ?? ""),
    createdById: String(sale.createdById ?? ""),
    createdAt: String(sale.createdAt ?? sale.soldAt),
    items: items.rows.map((item) => ({
      id: String(item.id),
      productId: String(item.productId),
      productName: String(item.productName),
      sku: String(item.sku ?? ""),
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
      lineTotal: Number(item.lineTotal ?? 0),
      createdAt: String(item.createdAt ?? "")
    }))
  };
}

export async function getPosDashboard() {
  const totalsResult = await requirePool().query(
    `with harare_today as (
       select (timezone('${HARARE_TIMEZONE}', now()))::date as today
     )
     select
       coalesce(sum(total_amount) filter (where date(timezone('${HARARE_TIMEZONE}', sold_at)) = (select today from harare_today)), 0) as "todayRevenue",
       count(*) filter (where date(timezone('${HARARE_TIMEZONE}', sold_at)) = (select today from harare_today)) as "todaySalesCount",
       coalesce(sum(total_units) filter (where date(timezone('${HARARE_TIMEZONE}', sold_at)) = (select today from harare_today)), 0) as "todayUnitsSold"
     from pos_sales`
  );

  const trendResult = await requirePool().query(
    `with harare_today as (
       select (timezone('${HARARE_TIMEZONE}', now()))::date as today
     ),
     days as (
       select generate_series(
         (select today from harare_today) - interval '6 days',
         (select today from harare_today),
         interval '1 day'
       )::date as day
     )
     select
       to_char(days.day, 'YYYY-MM-DD') as date,
       coalesce(sum(ps.total_amount), 0) as revenue,
       count(ps.id) as "salesCount"
     from days
     left join pos_sales ps
       on date(timezone('${HARARE_TIMEZONE}', ps.sold_at)) = days.day
     group by days.day
     order by days.day`
  );

  const totals = totalsResult.rows[0] as Record<string, string | number | null> | undefined;
  return {
    todayRevenue: Number(totals?.todayRevenue ?? 0),
    todaySalesCount: Number(totals?.todaySalesCount ?? 0),
    todayUnitsSold: Number(totals?.todayUnitsSold ?? 0),
    trend: trendResult.rows.map((row) => ({
      date: String(row.date ?? ""),
      revenue: Number(row.revenue ?? 0),
      salesCount: Number(row.salesCount ?? 0)
    }))
  };
}

export async function getPosSalesReport(from: string, to: string) {
  const range = parseDateRange({ from, to });
  const summaryResult = await requirePool().query(
    `select
       coalesce(sum(total_amount), 0) as "totalRevenue",
       count(*) as "salesCount",
       coalesce(sum(total_units), 0) as "unitsSold",
       coalesce(avg(total_amount), 0) as "averageSale"
     from pos_sales
     where date(timezone('${HARARE_TIMEZONE}', sold_at)) between $1::date and $2::date`,
    [range.from, range.to]
  );

  const trendResult = await requirePool().query(
    `with days as (
       select generate_series($1::date, $2::date, interval '1 day')::date as day
     )
     select
       to_char(days.day, 'YYYY-MM-DD') as date,
       coalesce(sum(ps.total_amount), 0) as revenue,
       count(ps.id) as "salesCount",
       coalesce(sum(ps.total_units), 0) as "unitsSold"
     from days
     left join pos_sales ps on date(timezone('${HARARE_TIMEZONE}', ps.sold_at)) = days.day
     group by days.day
     order by days.day`,
    [range.from, range.to]
  );

  const salesResult = await requirePool().query(
    `select
       ps.id,
       ps.sale_number as "saleNumber",
       ps.sold_at as "soldAt",
       ps.total_amount as "totalAmount",
       ps.total_units as "totalUnits",
       a.full_name as "recordedBy"
     from pos_sales ps
     join admins a on a.id = ps.created_by
     where date(timezone('${HARARE_TIMEZONE}', ps.sold_at)) between $1::date and $2::date
     order by ps.sold_at desc, ps.created_at desc`,
    [range.from, range.to]
  );

  const summary = summaryResult.rows[0] as Record<string, string | number | null> | undefined;
  return {
    period: range,
    summary: {
      totalRevenue: Number(summary?.totalRevenue ?? 0),
      salesCount: Number(summary?.salesCount ?? 0),
      unitsSold: Number(summary?.unitsSold ?? 0),
      averageSale: Number(summary?.averageSale ?? 0)
    },
    dailyTrend: trendResult.rows.map((row) => ({
      date: String(row.date ?? ""),
      revenue: Number(row.revenue ?? 0),
      salesCount: Number(row.salesCount ?? 0),
      unitsSold: Number(row.unitsSold ?? 0)
    })),
    sales: salesResult.rows.map(mapPosSaleSummary)
  };
}

async function loadProductsForSale(client: QueryRunner, items: Array<{ productId: string; quantity: number }>) {
  const productIds = items.map((item) => item.productId).sort();
  const result = await client.query<PosProductRow>(
    `select
       p.id,
       p.name,
       p.sku,
       p.price,
       p.stock_quantity,
       p.status,
       coalesce(pi.image_url, '/images/site/placeholder-product.jpg') as image_url
     from products p
     left join product_images pi on pi.product_id = p.id and pi.is_primary = true
     where p.id = any($1::uuid[])
     order by p.id
     for update`,
    [productIds]
  );

  const products = new Map(result.rows.map((row) => [row.id, row]));
  return items.map((item) => {
    const product = products.get(item.productId);
    if (!product) throw new AppError(404, "One of the requested products was not found.");
    if (product.status !== "ACTIVE") throw new AppError(409, `${product.name} is not available for sale.`);
    if (item.quantity > Number(product.stock_quantity)) {
      throw new AppError(409, `Insufficient stock. Only ${product.stock_quantity} units are available for ${product.name}.`);
    }
    return { ...product, quantity: item.quantity };
  });
}

async function nextPosSaleNumber(client: QueryRunner) {
  const sequence = await client.query<{ seq: string | number }>("select nextval('pos_sale_number_seq') as seq");
  const dayStamp = getHarareToday().replaceAll("-", "");
  return `WA-POS-${dayStamp}-${String(sequence.rows[0]?.seq ?? "1").padStart(4, "0")}`;
}

function mapPosSaleSummary(row: QueryResultRow) {
  return {
    id: String(row.id ?? ""),
    saleNumber: String(row.saleNumber ?? ""),
    soldAt: String(row.soldAt ?? ""),
    totalAmount: Number(row.totalAmount ?? 0),
    totalUnits: Number(row.totalUnits ?? 0),
    recordedBy: String(row.recordedBy ?? "")
  };
}

function differenceInUtcDays(from: string, to: string) {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.floor((end - start) / 86400000);
}
