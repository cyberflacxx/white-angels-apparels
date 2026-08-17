import { useEffect, useState } from "react";
import { api, type Category, type Product } from "../lib/api";

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    void Promise.all([api.get<Product[]>("/products"), api.get<Category[]>("/categories")]).then(([productRes, categoryRes]) => {
      setProducts(productRes.data);
      setCategories(categoryRes.data);
    });
  }, []);
  return { products, categories };
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
    whatsapp: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    openingHours: "",
    ecocashMerchantName: "",
    ecocashMerchantNumber: "",
    collectionInstructions: "Collection details will be confirmed after your order is approved.",
    defaultDeliveryFee: 5
  });
  useEffect(() => {
    void api.get<SiteSettings>("/settings").then((response) => setSettings(response.data)).catch(() => undefined);
  }, []);
  return settings;
}
