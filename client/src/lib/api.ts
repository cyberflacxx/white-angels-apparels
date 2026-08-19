import axios, { AxiosError, AxiosHeaders } from "axios";

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
  low_stock_threshold: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  image_url?: string;
  featured: boolean;
  new_arrival: boolean;
  images?: ProductImage[];
};

export type ProductImage = {
  id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
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

export type DashboardCardMetrics = {
  todaysSales: number;
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  awaitingPaymentVerification: number;
  homeDeliveries: number;
  shopCollections: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  customers: number;
  totalSubscribers: number;
};

export type DashboardOrder = {
  id: string;
  order_number: string;
  full_name: string;
  total: number | string;
  order_status: string;
  payment_status: string;
  fulfilment_method: string;
  created_at: string;
};

export type DashboardInventoryItem = {
  id: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
};

export type DashboardInventoryActivity = {
  id: string;
  product_name: string;
  movement_type: string;
  quantity: number;
  stock_after: number;
  created_at: string;
};

export type DashboardSalesPoint = {
  day: string;
  revenue: number;
  orders: number;
};

export type DashboardStatusPoint = {
  status: string;
  count: number;
};

export type AdminDashboardResponse = {
  cards: DashboardCardMetrics;
  recentOrders: DashboardOrder[];
  lowStock: DashboardInventoryItem[];
  inventoryActivity: DashboardInventoryActivity[];
  salesOverview: DashboardSalesPoint[];
  orderStatusCounts: DashboardStatusPoint[];
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

export type ApiErrorSummary = {
  message: string;
  fieldErrors: Record<string, string>;
  status?: number;
};

export function extractApiError(error: unknown, fallbackMessage = "Something went wrong."): ApiErrorSummary {
  const axiosError = error as AxiosError<any> | undefined;
  if (axiosError?.code === "ECONNABORTED" || (!axiosError?.response && axiosError?.request)) {
    return {
      message: "Unable to connect to White Angels. Check your connection and try again.",
      fieldErrors: {}
    };
  }

  const status = axiosError?.response?.status;
  const payload = axiosError?.response?.data;
  const fieldErrors = extractFieldErrors(payload);
  const rawMessage = firstNonEmptyString(
    payload?.message,
    payload?.error,
    fieldErrors[Object.keys(fieldErrors)[0] ?? ""]
  );
  const safeMessage = sanitizeApiErrorMessage(rawMessage);
  const message = mapFriendlyErrorMessage(status, safeMessage, payload, fallbackMessage);

  return {
    message,
    fieldErrors,
    status
  };
}

function extractFieldErrors(payload: any) {
  const fieldErrors: Record<string, string> = {};
  const issues = Array.isArray(payload?.errors)
    ? payload.errors
    : Array.isArray(payload?.issues)
      ? payload.issues
      : [];

  for (const issue of issues) {
    const key = normalizeFieldKey(issue?.path);
    const message = sanitizeApiErrorMessage(firstNonEmptyString(issue?.message, issue?.error, ""));
    if (key && message && !fieldErrors[key]) {
      fieldErrors[key] = message;
    }
  }

  if (payload?.errors && !Array.isArray(payload.errors) && typeof payload.errors === "object") {
    for (const [key, value] of Object.entries(payload.errors)) {
      const message = sanitizeApiErrorMessage(firstNonEmptyString(value, ""));
      if (message) fieldErrors[key] = message;
    }
  }

  return fieldErrors;
}

function normalizeFieldKey(path: unknown) {
  if (Array.isArray(path) && path.length) return String(path[path.length - 1]);
  if (typeof path === "string") return path;
  return "";
}

function sanitizeApiErrorMessage(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return "";
  if (/(postgres|sql|constraint|stack|\/opt\/|database_url|jwt_secret|private key|password)/i.test(trimmed)) {
    return "";
  }
  return trimmed;
}

function mapFriendlyErrorMessage(status: number | undefined, safeMessage: string, payload: any, fallbackMessage: string) {
  const lowerMessage = safeMessage.toLowerCase();

  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You are not permitted to perform this action.";
  if (status === 404 && /categor|product/.test(lowerMessage)) return safeMessage || "The requested product or category could not be found.";
  if (status === 409 && /sku/.test(lowerMessage)) return safeMessage || "A product with this SKU already exists.";
  if (status === 409 && /slug|url/.test(lowerMessage)) return safeMessage || "A product with this name/URL already exists.";
  if (status === 400 || status === 422) return safeMessage || "Please correct the highlighted product fields and try again.";
  if (status === 500) return "Product could not be saved. Please try again.";
  if (safeMessage) return safeMessage;
  if (typeof payload?.message === "string" && /network|fetch/i.test(payload.message)) {
    return "Unable to connect to White Angels. Check your connection and try again.";
  }
  return fallbackMessage;
}

function firstNonEmptyString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}
