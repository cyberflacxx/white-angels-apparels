import { z } from "zod";
import { validateSubscriberPhone } from "../services/subscriberService.js";

const requiredMessage = {
  fullName: "Please enter your full name.",
  phone: "Please enter your phone number.",
  deliveryMethod: "Please select a delivery method.",
  paymentMethod: "Please select a payment method.",
  address: "Please enter your delivery address.",
  cityArea: "Please enter your city, town, or area.",
  payerName: "Enter the name used for the EcoCash payment.",
  paymentProof: "Please upload the EcoCash payment screenshot."
} as const;

export const checkoutSchema = z.object({
  customer: z.object({
    fullName: z.string().trim().min(1, requiredMessage.fullName),
    phone: z.string().trim().min(1, requiredMessage.phone)
  }),
  fulfilmentMethod: z.enum(["HOME_DELIVERY", "SHOP_COLLECTION"], { message: requiredMessage.deliveryMethod }),
  deliveryAddress: z.object({
    addressLine1: z.string().trim().optional(),
    cityArea: z.string().trim().optional(),
    deliveryLatitude: z.coerce.number().finite().optional(),
    deliveryLongitude: z.coerce.number().finite().optional()
  }).optional(),
  paymentMethod: z.enum(["ECOCASH", "CASH"], { message: requiredMessage.paymentMethod }),
  payment: z.object({
    ecocashPayerName: z.string().trim().optional(),
    paymentProofUrl: z.string().trim().optional()
  }).optional(),
  items: z.array(z.object({ productId: z.string(), quantity: z.coerce.number().int().positive() })).min(1)
}).superRefine((value, ctx) => {
  const phoneValidation = validateSubscriberPhone(value.customer.phone);
  if (!phoneValidation.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customer", "phone"],
      message: phoneValidation.message
    });
  }

  if (value.fulfilmentMethod === "HOME_DELIVERY") {
    if (!value.deliveryAddress?.addressLine1?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryAddress", "addressLine1"],
        message: requiredMessage.address
      });
    }

    if (!value.deliveryAddress?.cityArea?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryAddress", "cityArea"],
        message: requiredMessage.cityArea
      });
    }
  }

  if (value.paymentMethod === "ECOCASH") {
    if (!value.payment?.ecocashPayerName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payment", "ecocashPayerName"],
        message: requiredMessage.payerName
      });
    }

    if (!value.payment?.paymentProofUrl?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payment", "paymentProofUrl"],
        message: requiredMessage.paymentProof
      });
    }
  }
});
