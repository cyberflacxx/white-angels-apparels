import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("admin authorization", () => {
  it("blocks protected admin endpoints without a JWT", async () => {
    const response = await request(createApp()).get("/api/v1/admin/dashboard");
    expect(response.status).toBe(401);
  });
});
