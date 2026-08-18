import { beforeEach, describe, expect, it, vi } from "vitest";

const connectMock = vi.fn();
const pooledQueryMock = vi.fn();

vi.mock("../db/pool.js", () => ({
  requirePool: () => ({
    connect: connectMock,
    query: pooledQueryMock
  })
}));

const {
  calculatePosTotals,
  getPosDashboard,
  getPosSalesReport,
  listPosSales,
  normalizePosItems,
  parseDateRange,
  recordPosSale
} = await import("../services/posService.js");

function createMockClient({
  products,
  existingSale
}: {
  products: Array<{ id: string; name: string; sku: string; price: string; stock_quantity: number; status: string; image_url?: string | null }>;
  existingSale?: { id: string; saleNumber: string; clientReference: string; soldAt: string; totalAmount: number; totalUnits: number; recordedBy: string; items: Array<{ id: string; productId: string; productName: string; sku: string; quantity: number; unitPrice: number; lineTotal: number; createdAt: string }> };
}) {
  const state = {
    products: new Map(products.map((product) => [product.id, { ...product, image_url: product.image_url ?? null }])),
    sale: existingSale
      ? {
          ...existingSale,
          createdById: "admin-1",
          createdAt: existingSale.soldAt
        }
      : null,
    insertedItems: existingSale ? [...existingSale.items] : [] as Array<any>,
    inventoryMovements: [] as Array<any>,
    committed: false,
    rolledBack: false
  };

  const client = {
    query: vi.fn(async (sql: string, params: unknown[] = []) => {
      if (sql === "begin" || sql === "commit") {
        if (sql === "commit") state.committed = true;
        return { rows: [] };
      }
      if (sql === "rollback") {
        state.rolledBack = true;
        return { rows: [] };
      }
      if (sql.includes("select id from pos_sales where client_reference")) {
        return { rows: state.sale && state.sale.clientReference === params[0] ? [{ id: state.sale.id }] : [] };
      }
      if (sql.includes("from products p") && sql.includes("for update")) {
        return { rows: Array.from(state.products.values()).sort((a, b) => a.id.localeCompare(b.id)) };
      }
      if (sql.includes("select nextval('pos_sale_number_seq')")) {
        return { rows: [{ seq: 1 }] };
      }
      if (sql.includes("insert into pos_sales")) {
        state.sale = {
          id: String(params[0]),
          saleNumber: String(params[1]),
          clientReference: String(params[2]),
          totalAmount: Number(params[3]),
          totalUnits: Number(params[4]),
          soldAt: "2026-08-18T10:00:00.000Z",
          recordedBy: "Admin User",
          createdById: String(params[5]),
          createdAt: "2026-08-18T10:00:00.000Z"
        };
        return { rows: [{ sold_at: state.sale.soldAt }] };
      }
      if (sql.includes("insert into pos_sale_items")) {
        state.insertedItems.push({
          id: String(params[0]),
          saleId: String(params[1]),
          productId: String(params[2]),
          productName: String(params[3]),
          sku: String(params[4]),
          quantity: Number(params[5]),
          unitPrice: Number(params[6]),
          lineTotal: Number(params[7]),
          createdAt: "2026-08-18T10:00:00.000Z"
        });
        return { rows: [] };
      }
      if (sql.includes("update products set stock_quantity")) {
        const product = state.products.get(String(params[1]));
        if (product) product.stock_quantity = Number(params[0]);
        return { rows: [] };
      }
      if (sql.includes("insert into inventory_movements")) {
        state.inventoryMovements.push({
          productId: String(params[1]),
          quantity: Number(params[2]),
          stockBefore: Number(params[3]),
          stockAfter: Number(params[4]),
          reference: String(params[5])
        });
        return { rows: [] };
      }
      throw new Error(`Unhandled client SQL in test: ${sql}`);
    }),
    release: vi.fn()
  };

  connectMock.mockResolvedValue(client);
  pooledQueryMock.mockImplementation(async (sql: string, params: unknown[] = []) => {
    if (sql.includes("from pos_sales ps") && sql.includes("where ps.id::text = $1 or ps.sale_number = $1")) {
      if (!state.sale) return { rows: [] };
      return {
        rows: [
          {
            id: state.sale.id,
            saleNumber: state.sale.saleNumber,
            clientReference: state.sale.clientReference,
            soldAt: state.sale.soldAt,
            totalAmount: state.sale.totalAmount,
            totalUnits: state.sale.totalUnits,
            createdAt: state.sale.createdAt,
            createdById: state.sale.createdById,
            recordedBy: state.sale.recordedBy
          }
        ]
      };
    }
    if (sql.includes("from pos_sale_items")) {
      return {
        rows: state.insertedItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          createdAt: item.createdAt
        }))
      };
    }
    throw new Error(`Unhandled pooled SQL in test: ${sql}`);
  });

  return { client, state };
}

describe("POS helpers", () => {
  beforeEach(() => {
    connectMock.mockReset();
    pooledQueryMock.mockReset();
  });

  it("normalizes duplicate sale items and calculates totals from authoritative prices", () => {
    expect(normalizePosItems([
      { productId: "a", quantity: 1 },
      { productId: "a", quantity: 2 },
      { productId: "b", quantity: 3 }
    ])).toEqual([
      { productId: "a", quantity: 3 },
      { productId: "b", quantity: 3 }
    ]);

    expect(calculatePosTotals([
      { quantity: 2, unitPrice: "12.50" },
      { quantity: 1, unitPrice: "7.00" }
    ])).toEqual({ totalUnits: 3, totalAmount: 32 });
  });

  it("validates and defaults date ranges using Zimbabwe business dates", () => {
    expect(parseDateRange({ from: "2026-08-01", to: "2026-08-07" })).toEqual({ from: "2026-08-01", to: "2026-08-07" });
    expect(() => parseDateRange({ from: "2026-08-10", to: "2026-08-01" })).toThrow(/from date/i);
  });
});

describe("recordPosSale", () => {
  beforeEach(() => {
    connectMock.mockReset();
    pooledQueryMock.mockReset();
  });

  it("records a valid sale, deducts stock, and writes inventory movements atomically", async () => {
    const { state } = createMockClient({
      products: [
        { id: "prod-1", name: "Dress", sku: "SKU-1", price: "10.00", stock_quantity: 5, status: "ACTIVE" },
        { id: "prod-2", name: "Blazer", sku: "SKU-2", price: "12.00", stock_quantity: 4, status: "ACTIVE" }
      ]
    });

    const sale = await recordPosSale(
      {
        clientReference: "2a83d4d8-3794-4e2d-9bb5-75d91ad4b1d1",
        items: [
          { productId: "prod-1", quantity: 2 },
          { productId: "prod-2", quantity: 1 }
        ]
      },
      "admin-1"
    );

    expect(sale.totalUnits).toBe(3);
    expect(sale.totalAmount).toBe(32);
    expect(state.products.get("prod-1")?.stock_quantity).toBe(3);
    expect(state.products.get("prod-2")?.stock_quantity).toBe(3);
    expect(state.inventoryMovements).toHaveLength(2);
    expect(state.committed).toBe(true);
  });

  it("rejects insufficient stock and rolls back without mutating stock", async () => {
    const { state } = createMockClient({
      products: [{ id: "prod-1", name: "Dress", sku: "SKU-1", price: "10.00", stock_quantity: 2, status: "ACTIVE" }]
    });

    await expect(
      recordPosSale(
        {
          clientReference: "75855645-beb2-462a-a701-daf248b3656c",
          items: [{ productId: "prod-1", quantity: 3 }]
        },
        "admin-1"
      )
    ).rejects.toThrow(/insufficient stock/i);

    expect(state.products.get("prod-1")?.stock_quantity).toBe(2);
    expect(state.insertedItems).toHaveLength(0);
    expect(state.rolledBack).toBe(true);
  });

  it("returns the existing sale for a duplicate client reference without double deduction", async () => {
    const { state } = createMockClient({
      products: [{ id: "prod-1", name: "Dress", sku: "SKU-1", price: "10.00", stock_quantity: 2, status: "ACTIVE" }],
      existingSale: {
        id: "sale-1",
        saleNumber: "WA-POS-20260818-0001",
        clientReference: "7816b84a-aee9-4b91-ad86-322daf730adf",
        soldAt: "2026-08-18T10:00:00.000Z",
        totalAmount: 20,
        totalUnits: 2,
        recordedBy: "Admin User",
        items: [
          {
            id: "item-1",
            productId: "prod-1",
            productName: "Dress",
            sku: "SKU-1",
            quantity: 2,
            unitPrice: 10,
            lineTotal: 20,
            createdAt: "2026-08-18T10:00:00.000Z"
          }
        ]
      }
    });

    const sale = await recordPosSale(
      {
        clientReference: "7816b84a-aee9-4b91-ad86-322daf730adf",
        items: [{ productId: "prod-1", quantity: 2 }]
      },
      "admin-1"
    );

    expect(sale.saleNumber).toBe("WA-POS-20260818-0001");
    expect(state.inventoryMovements).toHaveLength(0);
    expect(state.products.get("prod-1")?.stock_quantity).toBe(2);
  });
});

describe("POS dashboard and reporting", () => {
  beforeEach(() => {
    connectMock.mockReset();
    pooledQueryMock.mockReset();
  });

  it("returns dashboard totals and trend rows", async () => {
    pooledQueryMock
      .mockResolvedValueOnce({ rows: [{ todayRevenue: "245.00", todaySalesCount: "18", todayUnitsSold: "31" }] })
      .mockResolvedValueOnce({ rows: [{ date: "2026-08-18", revenue: "245.00", salesCount: "18" }] });

    await expect(getPosDashboard()).resolves.toEqual({
      todayRevenue: 245,
      todaySalesCount: 18,
      todayUnitsSold: 31,
      trend: [{ date: "2026-08-18", revenue: 245, salesCount: 18 }]
    });
  });

  it("returns report summaries and paginated sales history", async () => {
    pooledQueryMock
      .mockResolvedValueOnce({ rows: [{ totalRevenue: "300.00", salesCount: "3", unitsSold: "7", averageSale: "100.00" }] })
      .mockResolvedValueOnce({ rows: [{ date: "2026-08-18", revenue: "300.00", salesCount: "3", unitsSold: "7" }] })
      .mockResolvedValueOnce({ rows: [{ id: "sale-1", saleNumber: "WA-POS-20260818-0001", soldAt: "2026-08-18T10:00:00.000Z", totalAmount: "300.00", totalUnits: "7", recordedBy: "Admin User" }] });

    const report = await getPosSalesReport("2026-08-18", "2026-08-18");
    expect(report.summary).toEqual({ totalRevenue: 300, salesCount: 3, unitsSold: 7, averageSale: 100 });
    expect(report.sales).toHaveLength(1);

    pooledQueryMock
      .mockResolvedValueOnce({ rows: [{ count: "1" }] })
      .mockResolvedValueOnce({ rows: [{ id: "sale-1", saleNumber: "WA-POS-20260818-0001", soldAt: "2026-08-18T10:00:00.000Z", totalAmount: "300.00", totalUnits: "7", recordedBy: "Admin User" }] });

    const history = await listPosSales({ from: "2026-08-18", to: "2026-08-18", page: "1", limit: "10" });
    expect(history.total).toBe(1);
    expect(history.sales[0]?.saleNumber).toBe("WA-POS-20260818-0001");
  });
});
