import dotenv from "dotenv";
import path from "node:path";
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
  CLIENT_URLS: z.string().optional(),
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
  COLLECTION_INSTRUCTIONS: z.string().default("Collection details will be confirmed after your order is approved."),
  ADMIN_REGISTRATION_KEY: z.string().optional().default(""),
  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().positive().optional().default(465),
  SMTP_SECURE: z.coerce.boolean().optional().default(true),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  SMTP_FROM_NAME: z.string().default("White Angels Apparels"),
  SMTP_FROM_EMAIL: z.string().optional().default(""),
  WHATSAPP_PROVIDER: z.string().optional().default(""),
  WHATSAPP_ACCESS_TOKEN: z.string().optional().default(""),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional().default(""),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional().default(""),
  UPLOAD_DIR: z.string().default(path.resolve(process.cwd(), "uploads")),
  UPLOAD_PUBLIC_BASE: z.string().default("/uploads")
});

export const env = envSchema.parse(process.env);

export const siteSettings = {
  shopName: env.SHOP_NAME,
  logo: "White Angels Apparels",
  logoUrl: "/images/site/logo-white-angels.png",
  phone: env.SHOP_PHONE,
  email: env.SHOP_EMAIL,
  address: env.SHOP_ADDRESS,
  whatsapp: env.SHOP_WHATSAPP,
  facebook: env.FACEBOOK_URL,
  instagram: env.INSTAGRAM_URL,
  tiktok: env.TIKTOK_URL,
  heroHomeBg: "/images/site/hero-home-bg.jpg",
  heroHomeModel: "/images/site/hero-home-model.jpg",
  heroShop: "/images/site/hero-shop.jpg",
  heroAbout: "/images/site/hero-about.jpg",
  heroContact: "/images/site/hero-contact.jpg",
  heroCart: "/images/site/hero-cart.jpg",
  heroCheckout: "/images/site/hero-checkout.jpg",
  heroTrackOrder: "/images/site/hero-track-order.jpg",
  heroProduct: "/images/site/hero-product.jpg",
  heroAdminLogin: "/images/site/hero-admin-login.jpg",
  homePromoBanner: "/images/site/banner-home-promo.jpg",
  categoryWomen: "/images/site/category-women.jpg",
  categoryMen: "/images/site/category-men.jpg",
  categoryShoes: "/images/site/category-shoes.jpg",
  categoryAccessories: "/images/site/category-accessories.jpg",
  openingHours: "",
  ecocashMerchantName: env.ECOCASH_MERCHANT_NAME,
  ecocashMerchantNumber: env.ECOCASH_MERCHANT_NUMBER,
  collectionInstructions: env.COLLECTION_INSTRUCTIONS,
  defaultDeliveryFee: env.DEFAULT_DELIVERY_FEE
};
