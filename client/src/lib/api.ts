import axios, { AxiosHeaders } from "axios";

const developmentApiBaseUrl = "http://localhost:4100/api/v1";
const configuredApiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL?.trim() ?? "");
const defaultApiBaseUrl = import.meta.env.DEV ? developmentApiBaseUrl : "";

export const apiBaseUrl = configuredApiBaseUrl || defaultApiBaseUrl;
export const hasApiBaseUrl = Boolean(apiBaseUrl);

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15_000
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const token = window.localStorage.getItem("wa-admin-token");
  if (!token) return config;

  if (config.headers?.set) {
    config.headers.set("Authorization", `Bearer ${token}`);
  } else {
    config.headers = AxiosHeaders.from({
      ...config.headers,
      Authorization: `Bearer ${token}`
    });
  }

  return config;
});

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  category_name: string;
  short_description: string;
  description: string;
  price: string;
  previous_price?: string | null;
  stock_quantity: number;
  image_url?: string;
  featured: boolean;
  new_arrival: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url?: string;
};

export type SiteSettings = {
  id?: string;
  shopName: string;
  logo: string;
  logoUrl?: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  heroHomeBg?: string;
  heroHomeModel?: string;
  heroShop?: string;
  heroAbout?: string;
  heroContact?: string;
  heroCart?: string;
  heroCheckout?: string;
  heroTrackOrder?: string;
  heroProduct?: string;
  heroAdminLogin?: string;
  homePromoBanner?: string;
  categoryWomen?: string;
  categoryMen?: string;
  categoryShoes?: string;
  categoryAccessories?: string;
  openingHours: string;
  ecocashMerchantName: string;
  ecocashMerchantNumber: string;
  collectionInstructions: string;
  defaultDeliveryFee: number;
};

export type AdminAccount = {
  id: string;
  full_name: string;
  first_name: string;
  surname: string;
  email: string;
  role: string;
  status: string;
  email_verified_at?: string | null;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Subscriber = {
  id: string;
  name?: string | null;
  whatsapp_number: string;
  opted_in: boolean;
  opted_in_at?: string | null;
  status: "ACTIVE" | "UNSUBSCRIBED" | "INACTIVE";
  last_notification_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export function isProduct(value: unknown): value is Product {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as Product).id === "string" &&
      typeof (value as Product).name === "string" &&
      typeof (value as Product).slug === "string" &&
      typeof (value as Product).price === "string"
  );
}

export function isCategory(value: unknown): value is Category {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as Category).id === "string" &&
      typeof (value as Category).name === "string" &&
      typeof (value as Category).slug === "string"
  );
}

function normalizeApiBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}
