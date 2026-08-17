import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  HOST: z.string().default("127.0.0.1"),
  DATABASE_URL: z.string().min(1).optional(),
  DATABASE_SCHEMA: z
    .string()
    .regex(/^[a-z_][a-z0-9_]*$/i, "DATABASE_SCHEMA must be a valid PostgreSQL identifier")
    .default("white_angels_apparels"),
  DATABASE_APP_ROLE: z
    .string()
    .regex(/^[a-z_][a-z0-9_]*$/i, "DATABASE_APP_ROLE must be a valid PostgreSQL identifier")
    .default("white_angels_app"),
  JWT_SECRET: z.string().min(16).default("development_only_change_this_secret"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  DEFAULT_DELIVERY_FEE: z.coerce.number().nonnegative().default(5),
  SHOP_NAME: z.string().default("White Angels Apparels"),
  SHOP_PHONE: z.string().optional().default(""),
  SHOP_EMAIL: z.string().optional().default(""),
  SHOP_ADDRESS: z.string().optional().default(""),
  SHOP_WHATSAPP: z.string().optional().default(""),
  FACEBOOK_URL: z.string().optional().default(""),
  INSTAGRAM_URL: z.string().optional().default(""),
  TIKTOK_URL: z.string().optional().default(""),
  ECOCASH_MERCHANT_NAME: z.string().optional().default(""),
  ECOCASH_MERCHANT_NUMBER: z.string().optional().default(""),
  COLLECTION_INSTRUCTIONS: z.string().default("Collection details will be confirmed after your order is approved.")
});

export const env = envSchema.parse(process.env);

export const siteSettings = {
  shopName: env.SHOP_NAME,
  logo: "White Angels Apparels",
  phone: env.SHOP_PHONE,
  email: env.SHOP_EMAIL,
  address: env.SHOP_ADDRESS,
  whatsapp: env.SHOP_WHATSAPP,
  facebook: env.FACEBOOK_URL,
  instagram: env.INSTAGRAM_URL,
  tiktok: env.TIKTOK_URL,
  openingHours: "",
  ecocashMerchantName: env.ECOCASH_MERCHANT_NAME,
  ecocashMerchantNumber: env.ECOCASH_MERCHANT_NUMBER,
  collectionInstructions: env.COLLECTION_INSTRUCTIONS,
  defaultDeliveryFee: env.DEFAULT_DELIVERY_FEE
};
