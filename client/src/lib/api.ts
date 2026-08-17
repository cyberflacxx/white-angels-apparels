import axios from "axios";

const defaultApiBaseUrl = import.meta.env.PROD ? "/api/v1" : "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? defaultApiBaseUrl
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
