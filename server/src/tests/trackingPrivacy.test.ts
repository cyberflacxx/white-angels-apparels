import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("order tracking privacy", () => {
  it("requires both order number and phone", async () => {
    const response = await request(createApp()).post("/api/v1/orders/track").send({ orderNumber: "WA-2026-000001" });
    expect(response.status).toBe(400);
  });
});
