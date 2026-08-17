import { env } from "../config/env.js";

const requiredWhatsAppVariables = [
  "WHATSAPP_PROVIDER",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_BUSINESS_ACCOUNT_ID"
] as const;

export type WhatsAppSendResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; code: "WHATSAPP_NOT_CONFIGURED"; message: string; requiredEnvVars: readonly string[] };

export function isWhatsAppConfigured() {
  return Boolean(env.WHATSAPP_PROVIDER && env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
}

export function getRequiredWhatsAppVariables() {
  return requiredWhatsAppVariables;
}

export async function sendStockAlertMessage(_payload: {
  phoneNumber: string;
  templateName: string;
  messageBody: string;
}) : Promise<WhatsAppSendResult> {
  if (!isWhatsAppConfigured()) {
    return {
      ok: false,
      code: "WHATSAPP_NOT_CONFIGURED",
      message: "WhatsApp messaging service is not configured.",
      requiredEnvVars: requiredWhatsAppVariables
    };
  }

  return {
    ok: false,
    code: "WHATSAPP_NOT_CONFIGURED",
    message: "WhatsApp messaging service is not configured.",
    requiredEnvVars: requiredWhatsAppVariables
  };
}
