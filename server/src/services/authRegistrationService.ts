import crypto from "node:crypto";
import { env } from "../config/env.js";

const passwordRuleChecks = [
  { key: "length", label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { key: "uppercase", label: "At least one uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { key: "lowercase", label: "At least one lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { key: "digit", label: "At least one digit", test: (value: string) => /\d/.test(value) },
  { key: "special", label: "At least one special character", test: (value: string) => /[!@#$%^&*()_+\-=]/.test(value) }
] as const;

export function getPasswordRuleStatus(password: string) {
  return passwordRuleChecks.map((rule) => ({ key: rule.key, label: rule.label, met: rule.test(password) }));
}

export function validateAdminPassword(password: string) {
  const rules = getPasswordRuleStatus(password);
  const failed = rules.filter((rule) => !rule.met);
  return {
    valid: failed.length === 0,
    rules,
    message:
      failed.length === 0
        ? ""
        : "Password must be at least 8 characters and include uppercase, lowercase, digit, and special character."
  };
}

export function matchesAdminRegistrationKey(submittedKey: string) {
  return compareRegistrationKey(submittedKey, env.ADMIN_REGISTRATION_KEY);
}

export function compareRegistrationKey(submittedKey: string, configuredKey: string) {
  if (!configuredKey) return false;

  const submitted = Buffer.from(submittedKey);
  const expected = Buffer.from(configuredKey);

  if (submitted.length !== expected.length) return false;
  return crypto.timingSafeEqual(submitted, expected);
}

export function generateOtpCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtpCode(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export function maskEmailAddress(email: string) {
  const [localPart = "", domain = ""] = email.split("@");
  if (!localPart || !domain) return email;

  const visible = localPart.slice(0, 2);
  const maskedLocal = `${visible}${"*".repeat(Math.max(3, localPart.length - visible.length))}`;
  return `${maskedLocal}@${domain}`;
}

export function otpExpiresAt(createdAt = new Date()) {
  return new Date(createdAt.getTime() + env.OTP_EXPIRY_MINUTES * 60_000);
}

export function isOtpExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() <= now.getTime();
}

export function canAttemptOtp(attemptCount: number) {
  return attemptCount < env.OTP_MAX_ATTEMPTS;
}

export function canResendOtp(lastSentAt: Date | null, now = new Date()) {
  if (!lastSentAt) return true;
  return now.getTime() - lastSentAt.getTime() >= env.OTP_RESEND_COOLDOWN_SECONDS * 1000;
}

export function ensureAdminEmailAvailable(exists: boolean) {
  return exists ? "An administrator account already exists for this email." : "";
}

export function evaluateOtpVerification(input: {
  otpCode: string;
  otpHash: string;
  expiresAt: Date;
  attemptCount: number;
  now?: Date;
}) {
  if (!canAttemptOtp(input.attemptCount)) return { ok: false as const, reason: "attempts_exceeded" as const };
  if (isOtpExpired(input.expiresAt, input.now)) return { ok: false as const, reason: "expired" as const };
  if (hashOtpCode(input.otpCode) !== input.otpHash) return { ok: false as const, reason: "incorrect" as const };
  return { ok: true as const };
}
