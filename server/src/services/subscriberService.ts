export type SubscriberStatus = "ACTIVE" | "UNSUBSCRIBED" | "INACTIVE";

export function normalizeZimbabwePhoneNumber(value: string) {
  const digits = value.replace(/[^\d+]/g, "");

  if (/^\+2637\d{8}$/.test(digits)) return digits;
  if (/^2637\d{8}$/.test(digits)) return `+${digits}`;
  if (/^07\d{8}$/.test(digits)) return `+263${digits.slice(1)}`;

  return "";
}

export function validateSubscriberPhone(value: string) {
  const normalized = normalizeZimbabwePhoneNumber(value);
  return {
    valid: Boolean(normalized),
    normalized,
    message: normalized ? "" : "Enter a valid Zimbabwe WhatsApp number such as 077..., 071..., 078..., or +263..."
  };
}

export type SubscriberRecord = {
  id: string;
  status: SubscriberStatus;
  opted_in: boolean;
  whatsapp_number: string;
};

export function canReceiveStockAlert(subscriber: SubscriberRecord) {
  return subscriber.status === "ACTIVE" && subscriber.opted_in;
}

export function filterEligibleSubscribers<T extends SubscriberRecord>(subscribers: T[]) {
  return subscribers.filter(canReceiveStockAlert);
}
