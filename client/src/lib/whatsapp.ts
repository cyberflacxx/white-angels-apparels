const BUSINESS_WHATSAPP_NUMBER = "263786870610";
const BUSINESS_WHATSAPP_DISPLAY = "+263 78 687 0610";

export function getBusinessWhatsappNumber() {
  return BUSINESS_WHATSAPP_NUMBER;
}

export function getBusinessWhatsappDisplayNumber() {
  return BUSINESS_WHATSAPP_DISPLAY;
}

export function buildWhatsappChatUrl(message: string) {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) return "";

  const params = new URLSearchParams({ text: trimmedMessage });
  return `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?${params.toString()}`;
}

export function buildCustomerEnquiryMessage(fields: {
  name: string;
  phone: string;
  subject?: string;
  email?: string;
  message: string;
}) {
  const name = fields.name.trim();
  const phone = fields.phone.trim();
  const subject = fields.subject?.trim() ?? "";
  const email = fields.email?.trim() ?? "";
  const message = fields.message.trim();

  if (!name || !phone || !message) return "";

  const lines = [
    "Hello White Angels,",
    "",
    `Name: ${name}`,
    `Phone: ${phone}`
  ];

  if (subject) lines.push(`Subject: ${subject}`);
  if (email) lines.push(`Email: ${email}`);

  lines.push("", `Message: ${message}`);

  return lines.join("\n");
}
