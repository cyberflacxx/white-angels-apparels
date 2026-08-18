import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth.js";
import {
  getPosDashboard,
  getPosSaleById,
  getPosSalesReport,
  listPosProducts,
  listPosSales,
  recordPosSale
} from "../services/posService.js";

export const posRoutes = Router();

posRoutes.use(requireAdmin);

posRoutes.get("/products", async (req, res, next) => {
  try {
    res.json(await listPosProducts(String(req.query.search ?? "")));
  } catch (error) {
    next(error);
  }
});

posRoutes.post("/sales", async (req, res, next) => {
  try {
    const payload = z.object({
      clientReference: z.string().uuid(),
      items: z.array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.coerce.number().int().min(1)
        })
      ).min(1)
    }).parse(req.body);

    res.status(201).json(await recordPosSale(payload, req.admin!.sub));
  } catch (error) {
    next(error);
  }
});

posRoutes.get("/sales", async (req, res, next) => {
  try {
    res.json(
      await listPosSales({
        from: typeof req.query.from === "string" ? req.query.from : undefined,
        to: typeof req.query.to === "string" ? req.query.to : undefined,
        page: typeof req.query.page === "string" ? req.query.page : undefined,
        limit: typeof req.query.limit === "string" ? req.query.limit : undefined
      })
    );
  } catch (error) {
    next(error);
  }
});

posRoutes.get("/sales/:id", async (req, res, next) => {
  try {
    res.json(await getPosSaleById(String(req.params.id)));
  } catch (error) {
    next(error);
  }
});

posRoutes.get("/dashboard", async (_req, res, next) => {
  try {
    res.json(await getPosDashboard());
  } catch (error) {
    next(error);
  }
});

posRoutes.get("/reports/sales", async (req, res, next) => {
  try {
    const query = z.object({
      from: z.string(),
      to: z.string()
    }).parse(req.query);

    res.json(await getPosSalesReport(query.from, query.to));
  } catch (error) {
    next(error);
  }
});
