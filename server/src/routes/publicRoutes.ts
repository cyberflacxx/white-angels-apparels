import { Router } from "express";
import { siteSettings } from "../config/env.js";
import { AppError } from "../middleware/error.js";
import { listCategories, listProducts, getProductBySlug } from "../services/catalogService.js";
import { createOrder, getOrderForPublic, previewTotalsForFallback } from "../services/orderService.js";
import { checkoutSchema } from "../validation/orders.js";

export const publicRoutes = Router();

publicRoutes.get("/settings", (_req, res) => res.json(siteSettings));
publicRoutes.get("/categories", async (_req, res, next) => {
  try {
    res.json(await listCategories());
  } catch (error) {
    next(error);
  }
});
publicRoutes.get("/products", async (req, res, next) => {
  try {
    res.json(await listProducts({ category: String(req.query.category ?? ""), search: String(req.query.search ?? ""), sort: String(req.query.sort ?? ""), featured: req.query.featured === "true", newArrival: req.query.newArrival === "true" }));
  } catch (error) {
    next(error);
  }
});
publicRoutes.get("/products/:slug", async (req, res, next) => {
  try {
    const product = await getProductBySlug(req.params.slug);
    if (!product) throw new AppError(404, "Product not found.");
    res.json(product);
  } catch (error) {
    next(error);
  }
});
publicRoutes.post("/orders/preview", (req, res, next) => {
  try {
    const parsed = checkoutSchema.pick({ fulfilmentMethod: true, items: true }).parse(req.body);
    res.json(previewTotalsForFallback(parsed.items, parsed.fulfilmentMethod));
  } catch (error) {
    next(error);
  }
});
publicRoutes.post("/orders", async (req, res, next) => {
  try {
    res.status(201).json(await createOrder(checkoutSchema.parse(req.body)));
  } catch (error) {
    next(error);
  }
});
publicRoutes.post("/orders/track", async (req, res, next) => {
  try {
    const body = req.body as { orderNumber?: string; phone?: string };
    if (!body.orderNumber || !body.phone) throw new AppError(400, "Order number and phone are required.");
    res.json(await getOrderForPublic(body.orderNumber, body.phone));
  } catch (error) {
    next(error);
  }
});
