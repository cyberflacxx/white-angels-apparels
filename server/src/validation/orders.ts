import { z } from "zod";

export const checkoutSchema = z.object({
  customer: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(5),
    alternatePhone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    notes: z.string().optional()
  }),
  fulfilmentMethod: z.enum(["HOME_DELIVERY", "SHOP_COLLECTION"]),
  deliveryAddress: z.record(z.string(), z.string().optional()).optional(),
  paymentMethod: z.enum(["ECOCASH", "CASH"]),
  payment: z.object({ ecocashPhone: z.string().optional(), ecocashReference: z.string().optional(), paymentProofUrl: z.string().optional() }).optional(),
  items: z.array(z.object({ productId: z.string(), quantity: z.coerce.number().int().positive() })).min(1)
});
