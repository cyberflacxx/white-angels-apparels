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
