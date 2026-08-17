import axios from "axios";

const productionApiBaseUrl = "https://whiteangels.178.238.227.229.sslip.io/api/v1";
const developmentApiBaseUrl = "http://localhost:5000/api/v1";
const defaultApiBaseUrl = import.meta.env.PROD ? productionApiBaseUrl : developmentApiBaseUrl;

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
