import { describe, expect, it } from "vitest";
import { calculateOrderTotals, shouldRestoreStockOnCancel } from "../services/orderService.js";

describe("order calculations and stock validation", () => {
  it("calculates subtotal, delivery fee and total without trusting the client", () => {
    const totals = calculateOrderTotals([{ quantity: 2, price: "12.50", stock_quantity: 5 }], "HOME_DELIVERY", 4);
    expect(totals).toEqual({ subtotal: 25, deliveryFee: 4, total: 29 });
  });

  it("rejects quantities greater than available stock", () => {
    expect(() => calculateOrderTotals([{ quantity: 6, price: "10.00", stock_quantity: 5 }], "SHOP_COLLECTION")).toThrow(/stock/i);
  });

  it("prevents double stock restoration on repeated cancellation", () => {
    expect(shouldRestoreStockOnCancel({ order_status: "CONFIRMED", stock_restored_at: null })).toBe(true);
    expect(shouldRestoreStockOnCancel({ order_status: "CANCELLED", stock_restored_at: null })).toBe(false);
    expect(shouldRestoreStockOnCancel({ order_status: "CONFIRMED", stock_restored_at: new Date() })).toBe(false);
  });
});
