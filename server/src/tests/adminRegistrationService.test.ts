import { describe, expect, it } from "vitest";
import { compareRegistrationKey, ensureAdminEmailAvailable, evaluateOtpVerification, getPasswordRuleStatus, hashOtpCode, validateAdminPassword } from "../services/authRegistrationService.js";

describe("admin registration service", () => {
  it("enforces password rules", () => {
    expect(validateAdminPassword("weak").valid).toBe(false);
    expect(validateAdminPassword("Strong1!").valid).toBe(true);
    expect(getPasswordRuleStatus("Strong1!").every((rule) => rule.met)).toBe(true);
  });

  it("rejects an incorrect registration key", () => {
    expect(compareRegistrationKey("wrong-key", "correct-key")).toBe(false);
  });

  it("flags duplicate admin email use", () => {
    expect(ensureAdminEmailAvailable(true)).toMatch(/already exists/i);
    expect(ensureAdminEmailAvailable(false)).toBe("");
  });

  it("rejects expired otp codes", () => {
    const result = evaluateOtpVerification({
      otpCode: "123456",
      otpHash: hashOtpCode("123456"),
      expiresAt: new Date("2026-08-17T09:00:00Z"),
      attemptCount: 0,
      now: new Date("2026-08-17T09:01:00Z")
    });

    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects incorrect otp codes", () => {
    const result = evaluateOtpVerification({
      otpCode: "123456",
      otpHash: hashOtpCode("654321"),
      expiresAt: new Date("2026-08-17T09:10:00Z"),
      attemptCount: 0,
      now: new Date("2026-08-17T09:01:00Z")
    });

    expect(result).toEqual({ ok: false, reason: "incorrect" });
  });

  it("accepts a correct unexpired otp code", () => {
    const result = evaluateOtpVerification({
      otpCode: "123456",
      otpHash: hashOtpCode("123456"),
      expiresAt: new Date("2026-08-17T09:10:00Z"),
      attemptCount: 0,
      now: new Date("2026-08-17T09:01:00Z")
    });

    expect(result).toEqual({ ok: true });
  });
});
