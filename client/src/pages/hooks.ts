import { useEffect, useState } from "react";
import { api, hasApiBaseUrl, isCategory, isProduct, type Category, type Product } from "../lib/api";
import { WHATSAPP_CHANNEL_URL } from "../lib/site";

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogError, setCatalogError] = useState<string>("");
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!hasApiBaseUrl) {
      setCatalogError("Store data is unavailable because VITE_API_URL is not configured for this production build.");
      setIsCatalogLoading(false);
      return () => {
        active = false;
      };
    }

    setIsCatalogLoading(true);
    setCatalogError("");

    void Promise.allSettled([api.get<unknown>("/products"), api.get<unknown>("/categories")])
      .then(([productsResult, categoriesResult]) => {
        if (!active) return;

        const nextProducts = readList(productsResult, isProduct);
        const nextCategories = readList(categoriesResult, isCategory);

        setProducts(nextProducts);
        setCategories(nextCategories);

        const failures = [
          getListFailure(productsResult, nextProducts.length > 0 || isResolvedEmptyArray(productsResult), "products"),
          getListFailure(categoriesResult, nextCategories.length > 0 || isResolvedEmptyArray(categoriesResult), "categories")
        ].filter(Boolean);

        setCatalogError(failures[0] ?? "");
      })
      .finally(() => {
        if (active) setIsCatalogLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { products, categories, catalogError, isCatalogLoading };
}

export type SiteSettings = {
  shopName: string;
  logo: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  openingHours: string;
  ecocashMerchantName: string;
  ecocashMerchantNumber: string;
  collectionInstructions: string;
  defaultDeliveryFee: number;
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({
    shopName: "White Angels Apparels",
    logo: "White Angels Apparels",
    phone: "",
    email: "",
    address: "",
    whatsapp: WHATSAPP_CHANNEL_URL,
    facebook: "",
    instagram: "",
    tiktok: "",
    openingHours: "",
    ecocashMerchantName: "",
    ecocashMerchantNumber: "",
    collectionInstructions: "Collection details will be confirmed after your order is approved.",
    defaultDeliveryFee: 5
  });
  const [settingsError, setSettingsError] = useState<string>("");

  useEffect(() => {
    let active = true;

    if (!hasApiBaseUrl) {
      setSettingsError("Store settings are using local fallbacks because VITE_API_URL is not configured for this production build.");
      return () => {
        active = false;
      };
    }

    void api
      .get<unknown>("/settings")
      .then((response) => {
        if (!active) return;

        const nextSettings = normalizeSiteSettings(response.data);
        setSettings(nextSettings);
        setSettingsError("");
      })
      .catch(() => {
        if (active) {
          setSettingsError("Store settings could not be loaded. Default storefront contact details are being shown instead.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return { settings, settingsError };
}

function readList<T>(result: PromiseSettledResult<{ data: unknown }>, isItem: (value: unknown) => value is T) {
  if (result.status !== "fulfilled" || !Array.isArray(result.value.data)) return [];
  return result.value.data.filter(isItem);
}

function getListFailure(result: PromiseSettledResult<{ data: unknown }>, isValid: boolean, label: string) {
  if (result.status === "rejected") return `The ${label} service is temporarily unavailable. Showing fallback storefront content instead.`;
  if (!isValid) return `The ${label} response was invalid for this build. Showing fallback storefront content instead.`;
  return "";
}

function isResolvedEmptyArray(result: PromiseSettledResult<{ data: unknown }>) {
  return result.status === "fulfilled" && Array.isArray(result.value.data) && result.value.data.length === 0;
}

function normalizeSiteSettings(value: unknown): SiteSettings {
  const payload = value && typeof value === "object" ? value as Partial<SiteSettings> : {};

  return {
    shopName: readString(payload.shopName, "White Angels Apparels"),
    logo: readString(payload.logo, "White Angels Apparels"),
    phone: readString(payload.phone),
    email: readString(payload.email),
    address: readString(payload.address),
    whatsapp: readString(payload.whatsapp, WHATSAPP_CHANNEL_URL),
    facebook: readString(payload.facebook),
    instagram: readString(payload.instagram),
    tiktok: readString(payload.tiktok),
    openingHours: readString(payload.openingHours),
    ecocashMerchantName: readString(payload.ecocashMerchantName),
    ecocashMerchantNumber: readString(payload.ecocashMerchantNumber),
    collectionInstructions: readString(payload.collectionInstructions, "Collection details will be confirmed after your order is approved."),
    defaultDeliveryFee: typeof payload.defaultDeliveryFee === "number" ? payload.defaultDeliveryFee : 5
  };
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}
