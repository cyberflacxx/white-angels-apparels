import { describe, expect, it } from "vitest";
import { canReceiveStockAlert, filterEligibleSubscribers, normalizeZimbabwePhoneNumber, validateSubscriberPhone } from "../services/subscriberService.js";

describe("subscriber service", () => {
  it("normalizes supported Zimbabwe WhatsApp numbers", () => {
    expect(normalizeZimbabwePhoneNumber("0771234567")).toBe("+263771234567");
    expect(normalizeZimbabwePhoneNumber("+263771234567")).toBe("+263771234567");
  });

  it("validates subscriber opt-in numbers", () => {
    expect(validateSubscriberPhone("0711234567").valid).toBe(true);
    expect(validateSubscriberPhone("12345").valid).toBe(false);
  });

  it("does not allow unsubscribed subscribers to receive messages", () => {
    expect(
      canReceiveStockAlert({
        id: "1",
        whatsapp_number: "+263771234567",
        opted_in: false,
        status: "UNSUBSCRIBED"
      })
    ).toBe(false);
  });

  it("excludes inactive subscribers from bulk sends", () => {
    const eligible = filterEligibleSubscribers([
      { id: "1", whatsapp_number: "+263771234567", opted_in: true, status: "ACTIVE" },
      { id: "2", whatsapp_number: "+263781234567", opted_in: true, status: "INACTIVE" },
      { id: "3", whatsapp_number: "+263711234567", opted_in: false, status: "ACTIVE" }
    ]);

    expect(eligible).toHaveLength(1);
    expect(eligible[0]?.id).toBe("1");
  });
});
