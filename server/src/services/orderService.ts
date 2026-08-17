import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { env } from "../config/env.js";
import { requirePool } from "../db/pool.js";
import { AppError } from "../middleware/error.js";
import type { CartInput, FulfilmentMethod, PaymentMethod, PaymentStatus } from "../types/domain.js";
import { fallbackProducts } from "./catalogService.js";

export type CheckoutInput = {
  customer: { fullName: string; phone: string; alternatePhone?: string; email?: string; notes?: string };
  fulfilmentMethod: FulfilmentMethod;
  deliveryAddress?: Record<string, string | undefined>;
  paymentMethod: PaymentMethod;
  payment?: { ecocashPhone?: string; ecocashReference?: string; paymentProofUrl?: string };
  items: CartInput[];
};

export function calculateOrderTotals(
  items: { quantity: number; price: string | number; stock_quantity: number }[],
  fulfilmentMethod: FulfilmentMethod,
  deliveryFee = env.DEFAULT_DELIVERY_FEE
) {
  for (const item of items) {
    if (item.quantity < 1) throw new AppError(400, "Quantity must be at least 1.");
    if (item.quantity > item.stock_quantity) throw new AppError(400, "Requested quantity exceeds available stock.");
  }
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const fee = fulfilmentMethod === "HOME_DELIVERY" ? deliveryFee : 0;
  return { subtotal: roundMoney(subtotal), deliveryFee: roundMoney(fee), total: roundMoney(subtotal + fee) };
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export async function createOrder(input: CheckoutInput) {
  if (!input.items.length) throw new AppError(400, "Cart is empty.");
  const client = await requirePool().connect();
  try {
    await client.query("begin");
    const products = await loadProductsForUpdate(client, input.items);
    const totals = calculateOrderTotals(products, input.fulfilmentMethod);
    const customer = await upsertCustomer(client, input.customer);
    const orderNumber = await nextOrderNumber(client);
    const paymentStatus: PaymentStatus = input.paymentMethod === "ECOCASH" ? "PENDING_VERIFICATION" : "PENDING";
    const orderStatus = input.paymentMethod === "ECOCASH" ? "PAYMENT_VERIFICATION" : "CONFIRMED";
    const order = await client.query(
      `insert into orders (id, order_number, customer_id, subtotal, delivery_fee, total, payment_method, payment_status, fulfilment_method, order_status, customer_notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *`,
      [randomUUID(), orderNumber, customer.id, totals.subtotal, totals.deliveryFee, totals.total, input.paymentMethod, paymentStatus, input.fulfilmentMethod, orderStatus, input.customer.notes ?? null]
    );
    if (input.fulfilmentMethod === "HOME_DELIVERY") {
      await client.query(
        `insert into delivery_addresses (id, order_id, province, city, suburb, street, house_number, landmark, delivery_instructions)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [randomUUID(), order.rows[0].id, input.deliveryAddress?.province, input.deliveryAddress?.city, input.deliveryAddress?.suburb, input.deliveryAddress?.street, input.deliveryAddress?.houseNumber, input.deliveryAddress?.landmark, input.deliveryAddress?.deliveryInstructions]
      );
    }
    for (const item of products) {
      await client.query(
        `insert into order_items (id, order_id, product_id, product_name, sku, quantity, unit_price, line_total)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [randomUUID(), order.rows[0].id, item.id, item.name, item.sku, item.quantity, item.price, roundMoney(Number(item.price) * item.quantity)]
      );
      const after = item.stock_quantity - item.quantity;
      await client.query("update products set stock_quantity = $1, updated_at = now() where id = $2", [after, item.id]);
      await client.query(
        `insert into inventory_movements (id, product_id, movement_type, quantity, stock_before, stock_after, reference, notes)
         values ($1,$2,'SALE',$3,$4,$5,$6,$7)`,
        [randomUUID(), item.id, -item.quantity, item.stock_quantity, after, orderNumber, "Stock deducted at successful order placement."]
      );
    }
    await client.query(
      `insert into payments (id, order_id, method, amount, ecocash_phone, ecocash_reference, payment_proof_url, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [randomUUID(), order.rows[0].id, input.paymentMethod, totals.total, input.payment?.ecocashPhone ?? null, input.payment?.ecocashReference ?? null, input.payment?.paymentProofUrl ?? null, paymentStatus]
    );
    await client.query("insert into order_status_history (id, order_id, previous_status, new_status, notes) values ($1,$2,$3,$4,$5)", [randomUUID(), order.rows[0].id, null, orderStatus, "Order created."]);
    await client.query("commit");
    return getOrderForPublic(orderNumber, input.customer.phone);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export function shouldRestoreStockOnCancel(order: { order_status: string; stock_restored_at: Date | string | null }) {
  return order.order_status !== "CANCELLED" && !order.stock_restored_at;
}

export async function cancelOrder(orderId: string, changedBy?: string, notes = "Order cancelled.") {
  const client = await requirePool().connect();
  try {
    await client.query("begin");
    const orderResult = await client.query("select * from orders where id = $1 for update", [orderId]);
    const order = orderResult.rows[0] as { id: string; order_status: string; stock_restored_at: Date | null } | undefined;
    if (!order) throw new AppError(404, "Order not found.");

    if (shouldRestoreStockOnCancel(order)) {
      const items = await client.query<{ product_id: string | null; quantity: number }>("select product_id, quantity from order_items where order_id = $1", [order.id]);
      for (const item of items.rows) {
        if (!item.product_id) continue;
        const productResult = await client.query<{ id: string; stock_quantity: number }>("select id, stock_quantity from products where id = $1 for update", [item.product_id]);
        const product = productResult.rows[0];
        if (!product) continue;
        const after = product.stock_quantity + item.quantity;
        await client.query("update products set stock_quantity = $1, updated_at = now() where id = $2", [after, product.id]);
        await client.query(
          `insert into inventory_movements (id, product_id, movement_type, quantity, stock_before, stock_after, reference, notes, created_by)
           values ($1,$2,'RETURN',$3,$4,$5,$6,$7,$8)`,
          [randomUUID(), product.id, item.quantity, product.stock_quantity, after, order.id, "Stock restored after cancellation.", changedBy ?? null]
        );
      }
      await client.query("update orders set order_status = 'CANCELLED', stock_restored_at = now(), updated_at = now() where id = $1", [order.id]);
    } else {
      await client.query("update orders set order_status = 'CANCELLED', updated_at = now() where id = $1", [order.id]);
    }

    await client.query(
      "insert into order_status_history (id, order_id, previous_status, new_status, changed_by, notes) values ($1,$2,$3,'CANCELLED',$4,$5)",
      [randomUUID(), order.id, order.order_status, changedBy ?? null, notes]
    );
    await client.query("commit");
    return { ok: true, stockRestored: shouldRestoreStockOnCancel(order) };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function getOrderForPublic(orderNumber: string, phone?: string) {
  const params = phone ? [orderNumber, phone] : [orderNumber];
  const phoneClause = phone ? "and c.phone = $2" : "";
  const order = await requirePool().query(
    `select o.*, c.full_name, c.phone, c.alternate_phone, c.email
     from orders o join customers c on c.id = o.customer_id
     where o.order_number = $1 ${phoneClause}`,
    params
  );
  if (!order.rows[0]) throw new AppError(404, "Order not found.");
  const items = await requirePool().query("select * from order_items where order_id = $1 order by created_at", [order.rows[0].id]);
  const payment = await requirePool().query("select method, amount, status, ecocash_phone, ecocash_reference from payments where order_id = $1 order by created_at desc limit 1", [order.rows[0].id]);
  return { ...order.rows[0], items: items.rows, payment: payment.rows[0] };
}

async function loadProductsForUpdate(client: PoolClient, items: CartInput[]) {
  const rows = [];
  for (const item of items) {
    const result = await client.query("select * from products where id = $1 and status = 'ACTIVE' for update", [item.productId]);
    const product = result.rows[0];
    if (!product) throw new AppError(400, "A product in your cart is unavailable.");
    if (item.quantity > product.stock_quantity) throw new AppError(400, `${product.name} has insufficient stock.`);
    rows.push({ ...product, quantity: item.quantity });
  }
  return rows;
}

async function upsertCustomer(client: PoolClient, customer: CheckoutInput["customer"]) {
  const existing = await client.query("select * from customers where phone = $1", [customer.phone]);
  if (existing.rows[0]) return existing.rows[0];
  const created = await client.query("insert into customers (id, full_name, phone, alternate_phone, email) values ($1,$2,$3,$4,$5) returning *", [randomUUID(), customer.fullName, customer.phone, customer.alternatePhone ?? null, customer.email || null]);
  return created.rows[0];
}

async function nextOrderNumber(client: PoolClient) {
  const year = new Date().getFullYear();
  const result = await client.query("select nextval('order_number_seq') as seq");
  return `WA-${year}-${String(result.rows[0].seq).padStart(6, "0")}`;
}

export function previewTotalsForFallback(items: CartInput[], fulfilmentMethod: FulfilmentMethod) {
  const products = items.map((item) => {
    const product = fallbackProducts.find((candidate) => candidate.id === item.productId);
    if (!product) throw new AppError(400, "A product in your cart is unavailable.");
    return { ...product, quantity: item.quantity };
  });
  return calculateOrderTotals(products, fulfilmentMethod);
}
