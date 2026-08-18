import type { Category, Product, SiteSettings } from "./api";

const developmentApiBaseUrl = "http://localhost:4100/api/v1";
const configuredApiBaseUrl = import.meta.env.VITE_API_URL?.trim() ?? "";
const apiBaseUrl = configuredApiBaseUrl || (import.meta.env.DEV ? developmentApiBaseUrl : "");

export const mediaOrigin = readOrigin(apiBaseUrl);

export function resolveMediaUrl(value: string | null | undefined) {
  const input = typeof value === "string" ? value.trim() : "";
  if (!input) return "";
  if (/^(?:https?:|data:|blob:)/i.test(input)) return input;
  if (!/^\/?uploads(?:\/|$)/i.test(input)) return input;

  const normalizedPath = `/${input.replace(/^\/+/, "").replace(/\/{2,}/g, "/")}`;
  if (!mediaOrigin) return normalizedPath;
  return `${mediaOrigin}${normalizedPath}`;
}

export function normalizeProductMedia(product: Product): Product {
  return {
    ...product,
    image_url: resolveMediaUrl(product.image_url)
  };
}

export function normalizeCategoryMedia(category: Category): Category {
  return {
    ...category,
    image_url: resolveMediaUrl(category.image_url)
  };
}

export function normalizeSiteSettingsMedia(settings: SiteSettings): SiteSettings {
  return {
    ...settings,
    logoUrl: resolveMediaUrl(settings.logoUrl),
    heroHomeBg: resolveMediaUrl(settings.heroHomeBg),
    heroHomeModel: resolveMediaUrl(settings.heroHomeModel),
    heroShop: resolveMediaUrl(settings.heroShop),
    heroAbout: resolveMediaUrl(settings.heroAbout),
    heroContact: resolveMediaUrl(settings.heroContact),
    heroCart: resolveMediaUrl(settings.heroCart),
    heroCheckout: resolveMediaUrl(settings.heroCheckout),
    heroTrackOrder: resolveMediaUrl(settings.heroTrackOrder),
    heroProduct: resolveMediaUrl(settings.heroProduct),
    heroAdminLogin: resolveMediaUrl(settings.heroAdminLogin),
    homePromoBanner: resolveMediaUrl(settings.homePromoBanner),
    categoryWomen: resolveMediaUrl(settings.categoryWomen),
    categoryMen: resolveMediaUrl(settings.categoryMen),
    categoryShoes: resolveMediaUrl(settings.categoryShoes),
    categoryAccessories: resolveMediaUrl(settings.categoryAccessories)
  };
}

export function toStoredMediaPath(value: string | null | undefined) {
  const input = typeof value === "string" ? value.trim() : "";
  if (!input || !mediaOrigin) return input;
  if (!input.startsWith(`${mediaOrigin}/uploads/`)) return input;
  return input.slice(mediaOrigin.length);
}

export function toStoredSiteSettingsMedia(settings: SiteSettings): SiteSettings {
  return {
    ...settings,
    logoUrl: toStoredMediaPath(settings.logoUrl),
    heroHomeBg: toStoredMediaPath(settings.heroHomeBg),
    heroHomeModel: toStoredMediaPath(settings.heroHomeModel),
    heroShop: toStoredMediaPath(settings.heroShop),
    heroAbout: toStoredMediaPath(settings.heroAbout),
    heroContact: toStoredMediaPath(settings.heroContact),
    heroCart: toStoredMediaPath(settings.heroCart),
    heroCheckout: toStoredMediaPath(settings.heroCheckout),
    heroTrackOrder: toStoredMediaPath(settings.heroTrackOrder),
    heroProduct: toStoredMediaPath(settings.heroProduct),
    heroAdminLogin: toStoredMediaPath(settings.heroAdminLogin),
    homePromoBanner: toStoredMediaPath(settings.homePromoBanner),
    categoryWomen: toStoredMediaPath(settings.categoryWomen),
    categoryMen: toStoredMediaPath(settings.categoryMen),
    categoryShoes: toStoredMediaPath(settings.categoryShoes),
    categoryAccessories: toStoredMediaPath(settings.categoryAccessories)
  };
}

function readOrigin(value: string) {
  if (!value) return "";

  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}
