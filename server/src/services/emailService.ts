import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const requiredSmtpVariables = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM_NAME",
  "SMTP_FROM_EMAIL"
] as const;

export type EmailSendResult =
  | { ok: true; messageId?: string }
  | { ok: false; code: "EMAIL_NOT_CONFIGURED"; requiredEnvVars: readonly string[] };

function normalizedSmtpPassword() {
  return env.SMTP_PASSWORD.replace(/\s+/g, "");
}

function createTransporter() {
  return nodemailer.createTransport({
    host: env.SMTP_HOST || "smtp.gmail.com",
    port: env.SMTP_PORT || 465,
    secure: env.SMTP_SECURE ?? true,
    auth: {
      user: env.SMTP_USER,
      pass: normalizedSmtpPassword()
    }
  });
}

export function getRequiredSmtpVariables() {
  return requiredSmtpVariables;
}

export function isEmailServiceConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD && env.SMTP_FROM_EMAIL);
}

export async function verifyEmailTransport() {
  if (!isEmailServiceConfigured()) {
    return { ok: false as const, code: "EMAIL_NOT_CONFIGURED" as const, requiredEnvVars: requiredSmtpVariables };
  }

  await createTransporter().verify();
  return { ok: true as const };
}

export async function sendAdminOtpEmail({ email, maskedEmail, otpCode }: { email: string; maskedEmail: string; otpCode: string }): Promise<EmailSendResult> {
  if (!isEmailServiceConfigured()) {
    return { ok: false, code: "EMAIL_NOT_CONFIGURED", requiredEnvVars: requiredSmtpVariables };
  }

  const transporter = createTransporter();
  const expiryMinutes = env.OTP_EXPIRY_MINUTES;

  const result = await transporter.sendMail({
    from: {
      name: env.SMTP_FROM_NAME || "White Angels Apparels",
      address: env.SMTP_FROM_EMAIL
    },
    to: email,
    subject: "White Angels Admin Verification Code",
    text: [
      "White Angels Apparels",
      "",
      "Admin Account Verification",
      `Verification email for ${maskedEmail}`,
      "",
      `Your 6-digit OTP is: ${otpCode}`,
      `This code expires in ${expiryMinutes} minute${expiryMinutes === 1 ? "" : "s"}.`,
      "",
      "If you did not request this admin registration, ignore this email."
    ].join("\n"),
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f5f8ff;padding:24px;color:#071A3D;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;padding:32px;border:1px solid #d8e6ff;">
          <p style="margin:0 0 8px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#3A83F7;font-weight:700;">White Angels Apparels</p>
          <h1 style="margin:0 0 12px;font-size:28px;line-height:1.1;">Admin Account Verification</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">We received a request to register an admin account for <strong>${maskedEmail}</strong>.</p>
          <div style="margin:0 0 20px;padding:18px;border-radius:16px;background:#071A3D;color:#ffffff;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;opacity:.75;">6-digit OTP</p>
            <p style="margin:0;font-size:34px;letter-spacing:.22em;font-weight:800;">${otpCode}</p>
          </div>
          <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#334155;">This code expires in <strong>${expiryMinutes} minute${expiryMinutes === 1 ? "" : "s"}</strong>.</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#64748B;">If you did not request this admin registration, ignore this email. Do not share this code with anyone.</p>
        </div>
      </div>
    `
  });

  return { ok: true, messageId: result.messageId };
}

export async function sendEmailTestMessage() {
  if (!isEmailServiceConfigured()) {
    return { ok: false as const, code: "EMAIL_NOT_CONFIGURED" as const, requiredEnvVars: requiredSmtpVariables };
  }

  const transporter = createTransporter();
  await transporter.verify();
  const result = await transporter.sendMail({
    from: {
      name: env.SMTP_FROM_NAME || "White Angels Apparels",
      address: env.SMTP_FROM_EMAIL
    },
    to: "takundanyamandi@gmail.com",
    subject: "White Angels Email Test",
    text: "White Angels Apparels email service is configured successfully."
  });

  return { ok: true as const, messageId: result.messageId };
}
