export type PaymentMethod = "ECOCASH" | "CASH";
export type PaymentStatus = "PENDING" | "PENDING_VERIFICATION" | "PAID" | "REJECTED" | "REFUNDED";
export type FulfilmentMethod = "HOME_DELIVERY" | "SHOP_COLLECTION";
export type OrderStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "PAYMENT_VERIFICATION"
  | "PAID"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_COLLECTION"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COLLECTED"
  | "CANCELLED";

export type CartInput = {
  productId: string;
  quantity: number;
};
