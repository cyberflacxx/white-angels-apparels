import { describe, expect, it } from "vitest";
import { checkoutSchema } from "../validation/orders.js";

const baseItems = [{ productId: "product-1", quantity: 1 }];

describe("checkoutSchema", () => {
  it("accepts home delivery with address and shared coordinates", () => {
    const parsed = checkoutSchema.parse({
      customer: { fullName: "Genius Musonza", phone: "0786870610" },
      fulfilmentMethod: "HOME_DELIVERY",
      deliveryAddress: {
        addressLine1: "12 Area 16 Road",
        cityArea: "Mutare, Dangamvura Area 16",
        deliveryLatitude: -18.970201,
        deliveryLongitude: 32.670311
      },
      paymentMethod: "CASH",
      items: baseItems
    });

    expect(parsed.deliveryAddress?.deliveryLatitude).toBe(-18.970201);
    expect(parsed.payment).toBeUndefined();
  });

  it("accepts shop collection without delivery fields", () => {
    const parsed = checkoutSchema.parse({
      customer: { fullName: "Genius Musonza", phone: "+263786870610" },
      fulfilmentMethod: "SHOP_COLLECTION",
      paymentMethod: "CASH",
      items: baseItems
    });

    expect(parsed.fulfilmentMethod).toBe("SHOP_COLLECTION");
  });

  it("requires address fields for home delivery", () => {
    expect(() =>
      checkoutSchema.parse({
        customer: { fullName: "Genius Musonza", phone: "0786870610" },
        fulfilmentMethod: "HOME_DELIVERY",
        paymentMethod: "CASH",
        items: baseItems
      })
    ).toThrow(/delivery address/i);
  });

  it("requires EcoCash payer name and screenshot for EcoCash", () => {
    expect(() =>
      checkoutSchema.parse({
        customer: { fullName: "Genius Musonza", phone: "0786870610" },
        fulfilmentMethod: "SHOP_COLLECTION",
        paymentMethod: "ECOCASH",
        payment: {},
        items: baseItems
      })
    ).toThrow(/ecocash/i);
  });

  it("does not require retired fields", () => {
    const parsed = checkoutSchema.parse({
      customer: { fullName: "Genius Musonza", phone: "0786870610" },
      fulfilmentMethod: "SHOP_COLLECTION",
      paymentMethod: "CASH",
      items: baseItems
    });

    expect(parsed.customer).not.toHaveProperty("alternatePhone");
    expect(parsed.customer).not.toHaveProperty("email");
    expect(parsed.customer).not.toHaveProperty("notes");
  });
});
