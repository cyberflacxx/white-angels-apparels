import { Router } from "express";
import { AppError } from "../middleware/error.js";
import { listCategories, listProducts, getProductBySlug } from "../services/catalogService.js";
import { createOrder, getOrderForPublic, previewTotalsForFallback } from "../services/orderService.js";
import { getSiteSettings } from "../services/siteSettingsService.js";
import { validateSubscriberPhone } from "../services/subscriberService.js";
import { checkoutSchema } from "../validation/orders.js";
import { query } from "../db/pool.js";

export const publicRoutes = Router();

publicRoutes.get("/settings", async (_req, res, next) => {
  try {
    res.json(await getSiteSettings());
  } catch (error) {
    next(error);
  }
});

publicRoutes.get("/categories", async (_req, res, next) => {
  try {
    res.json(await listCategories());
  } catch (error) {
    next(error);
  }
});

publicRoutes.get("/products", async (req, res, next) => {
  try {
    res.json(
      await listProducts({
        category: String(req.query.category ?? ""),
        search: String(req.query.search ?? ""),
        sort: String(req.query.sort ?? ""),
        featured: req.query.featured === "true",
        newArrival: req.query.newArrival === "true"
      })
    );
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

publicRoutes.post("/stock-alerts/subscribe", async (req, res, next) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    const rawPhone = String(req.body?.whatsappNumber ?? "").trim();
    const optedIn = req.body?.optedIn === true;

    if (!rawPhone) throw new AppError(400, "WhatsApp number is required.");
    if (!optedIn) throw new AppError(400, "You must agree to receive White Angels stock updates on WhatsApp.");

    const phoneValidation = validateSubscriberPhone(rawPhone);
    if (!phoneValidation.valid) throw new AppError(400, phoneValidation.message);

    const result = await query(
      `insert into stock_alert_subscribers (name, whatsapp_number, opted_in, opted_in_at, status, updated_at)
       values ($1, $2, true, now(), 'ACTIVE', now())
       on conflict (whatsapp_number)
       do update set
         name = excluded.name,
         opted_in = true,
         opted_in_at = now(),
         status = 'ACTIVE',
         updated_at = now()
       returning *`,
      [name || null, phoneValidation.normalized]
    );

    res.status(201).json({ message: "You are subscribed to new stock alerts.", subscriber: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

publicRoutes.post("/stock-alerts/unsubscribe", async (req, res, next) => {
  try {
    const rawPhone = String(req.body?.whatsappNumber ?? "").trim();
    const phoneValidation = validateSubscriberPhone(rawPhone);
    if (!phoneValidation.valid) throw new AppError(400, phoneValidation.message);

    const result = await query(
      "update stock_alert_subscribers set opted_in = false, status = 'UNSUBSCRIBED', updated_at = now() where whatsapp_number = $1 returning *",
      [phoneValidation.normalized]
    );
    if (!result.rows[0]) throw new AppError(404, "Subscriber not found.");
    res.json({ message: "Subscription updated.", subscriber: result.rows[0] });
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
