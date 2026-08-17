import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env, siteSettings } from "../config/env.js";
import { query } from "../db/pool.js";
import { requireAdmin } from "../middleware/auth.js";
import { AppError } from "../middleware/error.js";
import { upload } from "../middleware/upload.js";
import { listCategories, listProducts } from "../services/catalogService.js";
import { cancelOrder } from "../services/orderService.js";

export const adminRoutes = Router();

adminRoutes.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) throw new AppError(400, "Email and password are required.");
    const result = await query("select * from admins where email = $1 and status = 'ACTIVE'", [email.toLowerCase()]);
    const admin = result.rows[0] as { id: string; email: string; password_hash: string; role: "ADMIN"; full_name: string } | undefined;
    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) throw new AppError(401, "Invalid credentials.");
    await query("update admins set last_login_at = now() where id = $1", [admin.id]);
    const token = jwt.sign({ sub: admin.id, email: admin.email, role: admin.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
    res.json({ token, admin: { id: admin.id, email: admin.email, role: admin.role, fullName: admin.full_name } });
  } catch (error) {
    next(error);
  }
});

adminRoutes.use(requireAdmin);

adminRoutes.get("/dashboard", (_req, res) => {
  res.json({
    cards: {
      todaysSales: 0,
      totalSales: 0,
      totalOrders: 0,
      pendingOrders: 0,
      awaitingPaymentVerification: 0,
      homeDeliveries: 0,
      shopCollections: 0,
      totalProducts: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      customers: 0
    },
    recentOrders: [],
    lowStock: [],
    inventoryActivity: [],
    salesOverview: []
  });
});

adminRoutes.get("/orders", async (_req, res, next) => {
  try {
    const result = await query("select o.*, c.full_name, c.phone from orders o join customers c on c.id = o.customer_id order by o.created_at desc limit 100");
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});
adminRoutes.get("/orders/:id", async (req, res, next) => {
  try {
    const result = await query<{ id: string }>("select * from orders where id::text = $1 or order_number = $1", [req.params.id]);
    if (!result.rows[0]) throw new AppError(404, "Order not found.");
    const items = await query("select * from order_items where order_id = $1", [result.rows[0].id]);
    const history = await query("select * from order_status_history where order_id = $1 order by created_at", [result.rows[0].id]);
    res.json({ ...result.rows[0], items: items.rows, history: history.rows });
  } catch (error) {
    next(error);
  }
});
adminRoutes.patch("/orders/:id/status", async (req, res, next) => {
  try {
    const { status, notes } = req.body as { status?: string; notes?: string };
    if (!status) throw new AppError(400, "Status is required.");
    if (status === "CANCELLED") {
      res.json(await cancelOrder(req.params.id, req.admin?.sub, notes));
      return;
    }
    const current = await query<{ order_status: string }>("select order_status from orders where id = $1", [req.params.id]);
    await query("update orders set order_status = $1, updated_at = now() where id = $2", [status, req.params.id]);
    await query("insert into order_status_history (order_id, previous_status, new_status, changed_by, notes) values ($1,$2,$3,$4,$5)", [req.params.id, current.rows[0]?.order_status, status, req.admin?.sub, notes ?? null]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
adminRoutes.get("/products", async (_req, res) => res.json(await listProducts()));
adminRoutes.post("/products", upload.array("images"), (_req, res) => res.status(201).json({ message: "Product creation endpoint prepared for multipart product data." }));
adminRoutes.put("/products/:id", upload.array("images"), (_req, res) => res.json({ message: "Product update endpoint prepared." }));
adminRoutes.delete("/products/:id", async (req, res, next) => {
  try {
    await query("update products set status = 'ARCHIVED', updated_at = now() where id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
adminRoutes.get("/categories", async (_req, res) => res.json(await listCategories()));
adminRoutes.post("/categories", (_req, res) => res.status(201).json({ message: "Category creation endpoint prepared." }));
adminRoutes.put("/categories/:id", (_req, res) => res.json({ message: "Category update endpoint prepared." }));
adminRoutes.get("/inventory", async (_req, res, next) => {
  try {
    const result = await query("select im.*, p.name from inventory_movements im join products p on p.id = im.product_id order by im.created_at desc limit 100");
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});
adminRoutes.post("/inventory/adjust", (_req, res) => res.status(201).json({ message: "Stock adjustment endpoint prepared with inventory movement history." }));
adminRoutes.get("/customers", async (_req, res, next) => {
  try {
    const result = await query("select * from customers order by created_at desc limit 100");
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});
adminRoutes.get("/reports", (_req, res) => res.json({ sales: [], inventory: [], customers: [] }));
adminRoutes.get("/settings", (_req, res) => res.json(siteSettings));
