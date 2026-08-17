import { useEffect, useState } from "react";
import { api, hasApiBaseUrl, isCategory, isProduct, type AdminAccount, type Category, type Product, type SiteSettings, type Subscriber } from "../lib/api";
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

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({
    shopName: "White Angels Apparels",
    logo: "White Angels Apparels",
    logoUrl: "/images/site/logo-white-angels.png",
    phone: "",
    email: "",
    address: "",
    whatsapp: WHATSAPP_CHANNEL_URL,
    facebook: "",
    instagram: "",
    tiktok: "",
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

export function useAdminAccount(enabled = true) {
  const [account, setAccount] = useState<AdminAccount | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true);

    void api
      .get<AdminAccount>("/admin/account")
      .then((response) => {
        if (!active) return;
        setAccount(response.data);
        setError("");
      })
      .catch(() => {
        if (active) setError("Your admin account details could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return { account, loading, error, setAccount };
}

export function useSubscribers(enabled = true) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true);

    void api
      .get<Subscriber[]>("/admin/subscribers")
      .then((response) => {
        if (!active) return;
        setSubscribers(response.data);
        setError("");
      })
      .catch(() => {
        if (active) setError("Subscriber records could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return { subscribers, loading, error, setSubscribers };
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
    logoUrl: readString(payload.logoUrl, "/images/site/logo-white-angels.png"),
    heroHomeBg: readString(payload.heroHomeBg, "/images/site/hero-home-bg.jpg"),
    heroHomeModel: readString(payload.heroHomeModel, "/images/site/hero-home-model.jpg"),
    heroShop: readString(payload.heroShop, "/images/site/hero-shop.jpg"),
    heroAbout: readString(payload.heroAbout, "/images/site/hero-about.jpg"),
    heroContact: readString(payload.heroContact, "/images/site/hero-contact.jpg"),
    heroCart: readString(payload.heroCart, "/images/site/hero-cart.jpg"),
    heroCheckout: readString(payload.heroCheckout, "/images/site/hero-checkout.jpg"),
    heroTrackOrder: readString(payload.heroTrackOrder, "/images/site/hero-track-order.jpg"),
    heroProduct: readString(payload.heroProduct, "/images/site/hero-product.jpg"),
    heroAdminLogin: readString(payload.heroAdminLogin, "/images/site/hero-admin-login.jpg"),
    homePromoBanner: readString(payload.homePromoBanner, "/images/site/banner-home-promo.jpg"),
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
