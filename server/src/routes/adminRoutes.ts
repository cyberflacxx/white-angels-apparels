import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { env } from "../config/env.js";
import { query, requirePool } from "../db/pool.js";
import { requireAdmin } from "../middleware/auth.js";
import { AppError } from "../middleware/error.js";
import { productUpload, siteUpload } from "../middleware/upload.js";
import { cancelOrder } from "../services/orderService.js";
import { getSiteSettings, updateSiteSettings } from "../services/siteSettingsService.js";
import { canAttemptOtp, canResendOtp, generateOtpCode, hashOtpCode, maskEmailAddress, matchesAdminRegistrationKey, otpExpiresAt, validateAdminPassword } from "../services/authRegistrationService.js";
import { sendAdminOtpEmail } from "../services/emailService.js";
import { canReceiveStockAlert, filterEligibleSubscribers } from "../services/subscriberService.js";
import { getRequiredWhatsAppVariables, sendStockAlertMessage } from "../services/whatsappService.js";
import { listCategories } from "../services/catalogService.js";
import { adjustInventory, createProduct, deleteProductImage, getAdminProductById, listAdminProducts, parseProductPayload, reorderProductImages, setPrimaryProductImage, updateProduct } from "../services/productAdminService.js";

export const adminRoutes = Router();

const registrationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8 });
const otpVerifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });

async function sendRegistrationOtpOrThrow(email: string, otpCode: string) {
  try {
    const emailResult = await sendAdminOtpEmail({
      email,
      maskedEmail: maskEmailAddress(email),
      otpCode
    });

    if (!emailResult.ok) {
      throw new AppError(503, "Email service is currently unavailable. Please try again later.");
    }
  } catch {
    throw new AppError(503, "Email service is currently unavailable. Please try again later.");
  }
}

adminRoutes.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) throw new AppError(400, "Email and password are required.");

    const result = await query(
      "select id, email, password_hash, role, full_name, first_name, surname, status from admins where lower(email) = $1 and status = 'ACTIVE'",
      [email.toLowerCase()]
    );
    const admin = result.rows[0] as {
      id: string;
      email: string;
      password_hash: string;
      role: "ADMIN";
      full_name: string;
      first_name?: string;
      surname?: string;
      status: "ACTIVE";
    } | undefined;

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) throw new AppError(401, "Invalid credentials.");

    await query("update admins set last_login_at = now(), updated_at = now() where id = $1", [admin.id]);
    const token = jwt.sign({ sub: admin.id, email: admin.email, role: admin.role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
    });

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        fullName: admin.full_name,
        firstName: admin.first_name ?? admin.full_name.split(" ")[0] ?? "",
        surname: admin.surname ?? ""
      }
    });
  } catch (error) {
    next(error);
  }
});

adminRoutes.post("/auth/register", registrationLimiter, async (req, res, next) => {
  try {
    const body = req.body as {
      firstName?: string;
      surname?: string;
      email?: string;
      password?: string;
      registrationKey?: string;
    };

    const firstName = body.firstName?.trim() ?? "";
    const surname = body.surname?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const registrationKey = body.registrationKey ?? "";

    if (!firstName || !surname || !email || !password || !registrationKey) {
      throw new AppError(400, "Complete every registration field before continuing.");
    }

    const passwordValidation = validateAdminPassword(password);
    if (!passwordValidation.valid) throw new AppError(400, passwordValidation.message);
    if (!matchesAdminRegistrationKey(registrationKey)) throw new AppError(400, "Invalid admin registration key.");

    const client = await requirePool().connect();
    let verificationId = "";
    try {
      await client.query("begin");

      const duplicateAdmin = await client.query("select 1 from admins where lower(email) = $1 limit 1", [email]);
      if (duplicateAdmin.rows[0]) throw new AppError(409, "An administrator account already exists for this email.");

      const otpCode = generateOtpCode();
      const passwordHash = await bcrypt.hash(password, 12);
      const otpHash = hashOtpCode(otpCode);
      const verificationResult = await client.query(
        `insert into admin_email_verifications
          (email, first_name, surname, password_hash, otp_hash, expires_at, attempt_count, resend_count, last_sent_at, verified_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, 0, 0, now(), null, now())
         on conflict ((lower(email))) where verified_at is null
         do update set
           first_name = excluded.first_name,
           surname = excluded.surname,
           password_hash = excluded.password_hash,
           otp_hash = excluded.otp_hash,
           expires_at = excluded.expires_at,
           attempt_count = 0,
           resend_count = 0,
           last_sent_at = now(),
           verified_at = null,
           updated_at = now()
         returning id`,
        [email, firstName, surname, passwordHash, otpHash, otpExpiresAt()]
      );

      await sendRegistrationOtpOrThrow(email, otpCode);
      await client.query("commit");
      verificationId = String(verificationResult.rows[0]?.id ?? "");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }

    res.status(202).json({
      verificationId,
      email,
      maskedEmail: maskEmailAddress(email),
      message: "Verification code sent."
    });
  } catch (error) {
    next(error);
  }
});

adminRoutes.post("/auth/register/resend", registrationLimiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    if (!email) throw new AppError(400, "Email is required.");

    const client = await requirePool().connect();
    try {
      await client.query("begin");

      const pending = await client.query(
        "select id, email, first_name, surname, password_hash, attempt_count, resend_count, last_sent_at, verified_at from admin_email_verifications where lower(email) = $1 order by created_at desc limit 1",
        [email]
      );
      const verification = pending.rows[0] as {
        id: string;
        email: string;
        first_name: string;
        surname: string;
        password_hash: string;
        attempt_count: number;
        resend_count: number;
        last_sent_at: Date;
        verified_at: Date | null;
      } | undefined;

      if (!verification || verification.verified_at) throw new AppError(404, "No pending verification was found for that email.");
      if (!canResendOtp(verification.last_sent_at ? new Date(verification.last_sent_at) : null)) {
        throw new AppError(429, "Please wait before requesting another verification code.");
      }

      const otpCode = generateOtpCode();
      const otpHash = hashOtpCode(otpCode);
      await client.query(
        "update admin_email_verifications set otp_hash = $1, expires_at = $2, resend_count = resend_count + 1, attempt_count = 0, last_sent_at = now(), updated_at = now() where id = $3",
        [otpHash, otpExpiresAt(), verification.id]
      );

      await sendRegistrationOtpOrThrow(email, otpCode);
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }

    res.json({ maskedEmail: maskEmailAddress(email), message: "Verification code sent." });
  } catch (error) {
    next(error);
  }
});

adminRoutes.post("/auth/register/verify", otpVerifyLimiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const otpCode = String(req.body?.otpCode ?? "").trim();
    if (!email || !otpCode) throw new AppError(400, "Email and OTP code are required.");

    const pendingResult = await query(
      "select * from admin_email_verifications where lower(email) = $1 and verified_at is null order by created_at desc limit 1",
      [email]
    );
    const pending = pendingResult.rows[0] as {
      id: string;
      email: string;
      first_name: string;
      surname: string;
      password_hash: string;
      otp_hash: string;
      expires_at: Date;
      attempt_count: number;
    } | undefined;

    if (!pending) throw new AppError(404, "No pending verification was found for that email.");
    if (!canAttemptOtp(pending.attempt_count)) throw new AppError(429, "Verification attempts exceeded. Request a new code.");
    if (new Date(pending.expires_at).getTime() <= Date.now()) throw new AppError(400, "Verification code expired. Request a new code.");

    if (hashOtpCode(otpCode) !== pending.otp_hash) {
      await query("update admin_email_verifications set attempt_count = attempt_count + 1, updated_at = now() where id = $1", [pending.id]);
      throw new AppError(400, "Incorrect verification code.");
    }

    const duplicateAdmin = await query("select 1 from admins where lower(email) = $1 limit 1", [email]);
    if (duplicateAdmin.rows[0]) throw new AppError(409, "An administrator account already exists for this email.");

    const fullName = `${pending.first_name} ${pending.surname}`.trim();
    const adminInsert = await query(
      `insert into admins (full_name, first_name, surname, email, password_hash, role, status, email_verified_at, created_at, updated_at)
       values ($1, $2, $3, $4, $5, 'ADMIN', 'ACTIVE', now(), now(), now())
       returning id, email, full_name, first_name, surname, role, status, email_verified_at`,
      [fullName, pending.first_name, pending.surname, email, pending.password_hash]
    );

    await query("update admin_email_verifications set verified_at = now(), updated_at = now() where id = $1", [pending.id]);

    res.status(201).json({
      message: "Account Created Successfully",
      admin: adminInsert.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

adminRoutes.use(requireAdmin);

adminRoutes.get("/account", async (req, res, next) => {
  try {
    const result = await query(
      "select id, full_name, first_name, surname, email, role, status, email_verified_at, last_login_at, created_at, updated_at from admins where id = $1",
      [req.admin?.sub]
    );
    if (!result.rows[0]) throw new AppError(404, "Admin account not found.");
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

adminRoutes.post("/account/change-password", async (req, res, next) => {
  try {
    const currentPassword = String(req.body?.currentPassword ?? "");
    const nextPassword = String(req.body?.nextPassword ?? "");
    const confirmPassword = String(req.body?.confirmPassword ?? "");
    if (!currentPassword || !nextPassword || !confirmPassword) throw new AppError(400, "Complete the password form.");

    const result = await query("select password_hash from admins where id = $1", [req.admin?.sub]);
    const admin = result.rows[0] as { password_hash: string } | undefined;
    if (!admin || !(await bcrypt.compare(currentPassword, admin.password_hash))) throw new AppError(401, "Current password is incorrect.");

    const passwordValidation = validateAdminPassword(nextPassword);
    if (!passwordValidation.valid) throw new AppError(400, passwordValidation.message);
    if (nextPassword !== confirmPassword) throw new AppError(400, "Confirm password must match.");

    const passwordHash = await bcrypt.hash(nextPassword, 12);
    await query("update admins set password_hash = $1, updated_at = now() where id = $2", [passwordHash, req.admin?.sub]);
    res.json({ message: "Password updated." });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get("/dashboard", async (_req, res, next) => {
  try {
    const cardsResult = await query(
      `select
         coalesce(sum(case when created_at >= current_date and order_status <> 'CANCELLED' then total else 0 end), 0) as todays_sales,
         coalesce(sum(case when order_status <> 'CANCELLED' then total else 0 end), 0) as total_sales,
         count(*) as total_orders,
         count(*) filter (where order_status not in ('DELIVERED', 'COLLECTED', 'CANCELLED')) as pending_orders,
         count(*) filter (where payment_status = 'PENDING_VERIFICATION') as awaiting_payment_verification,
         count(*) filter (where fulfilment_method = 'HOME_DELIVERY') as home_deliveries,
         count(*) filter (where fulfilment_method = 'SHOP_COLLECTION') as shop_collections
       from orders`
    );
    const productStatsResult = await query(
      `select
         count(*) filter (where status = 'ACTIVE') as total_products,
         count(*) filter (where status = 'ACTIVE' and stock_quantity > 0 and stock_quantity <= low_stock_threshold) as low_stock_products,
         count(*) filter (where status = 'ACTIVE' and stock_quantity <= 0) as out_of_stock_products
       from products`
    );
    const customerStatsResult = await query("select count(*) as customers from customers");
    const subscriberStatsResult = await query("select count(*) as total_subscribers from stock_alert_subscribers");
    const recentOrdersResult = await query(
      `select o.id, o.order_number, o.total, o.order_status, o.payment_status, o.fulfilment_method, o.created_at, c.full_name
       from orders o
       join customers c on c.id = o.customer_id
       order by o.created_at desc
       limit 6`
    );
    const lowStockResult = await query(
      `select id, name, stock_quantity, low_stock_threshold
       from products
       where status = 'ACTIVE' and stock_quantity > 0 and stock_quantity <= low_stock_threshold
       order by stock_quantity asc, updated_at desc
       limit 6`
    );
    const inventoryActivityResult = await query(
      `select im.id, p.name as product_name, im.movement_type, im.quantity, im.stock_after, im.created_at
       from inventory_movements im
       join products p on p.id = im.product_id
       order by im.created_at desc
       limit 6`
    );
    const salesOverviewResult = await query(
      `select
         to_char(days.day, 'Dy') as day,
         coalesce(sum(o.total) filter (where o.order_status <> 'CANCELLED'), 0) as revenue,
         count(o.id) filter (where o.order_status <> 'CANCELLED') as orders
       from generate_series(current_date - interval '6 days', current_date, interval '1 day') as days(day)
       left join orders o on date(o.created_at) = days.day::date
       group by days.day
       order by days.day`
    );
    const orderStatusCountsResult = await query(
      `select order_status as status, count(*) as count
       from orders
       group by order_status
       order by count(*) desc, order_status asc`
    );

    const cards = cardsResult.rows[0] as Record<string, string | number | null> | undefined;
    const productStats = productStatsResult.rows[0] as Record<string, string | number | null> | undefined;
    const customerStats = customerStatsResult.rows[0] as Record<string, string | number | null> | undefined;
    const subscriberStats = subscriberStatsResult.rows[0] as Record<string, string | number | null> | undefined;

    res.json({
      cards: {
        todaysSales: Number(cards?.todays_sales ?? 0),
        totalSales: Number(cards?.total_sales ?? 0),
        totalOrders: Number(cards?.total_orders ?? 0),
        pendingOrders: Number(cards?.pending_orders ?? 0),
        awaitingPaymentVerification: Number(cards?.awaiting_payment_verification ?? 0),
        homeDeliveries: Number(cards?.home_deliveries ?? 0),
        shopCollections: Number(cards?.shop_collections ?? 0),
        totalProducts: Number(productStats?.total_products ?? 0),
        lowStockProducts: Number(productStats?.low_stock_products ?? 0),
        outOfStockProducts: Number(productStats?.out_of_stock_products ?? 0),
        customers: Number(customerStats?.customers ?? 0),
        totalSubscribers: Number(subscriberStats?.total_subscribers ?? 0)
      },
      recentOrders: recentOrdersResult.rows,
      lowStock: lowStockResult.rows,
      inventoryActivity: inventoryActivityResult.rows,
      salesOverview: salesOverviewResult.rows.map((row) => ({
        day: String(row.day ?? ""),
        revenue: Number(row.revenue ?? 0),
        orders: Number(row.orders ?? 0)
      })),
      orderStatusCounts: orderStatusCountsResult.rows.map((row) => ({
        status: String(row.status ?? ""),
        count: Number(row.count ?? 0)
      }))
    });
  } catch (error) {
    next(error);
  }
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
    const result = await query<{ id: string }>(
      `select o.*, c.full_name, c.phone
       from orders o
       join customers c on c.id = o.customer_id
       where o.id::text = $1 or o.order_number = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) throw new AppError(404, "Order not found.");
    const items = await query("select * from order_items where order_id = $1", [result.rows[0].id]);
    const history = await query("select * from order_status_history where order_id = $1 order by created_at", [result.rows[0].id]);
    const deliveryAddress = await query(
      "select city, street, delivery_latitude, delivery_longitude from delivery_addresses where order_id = $1 limit 1",
      [result.rows[0].id]
    );
    const payment = await query(
      "select method, amount, status, ecocash_payer_name, payment_proof_url from payments where order_id = $1 order by created_at desc limit 1",
      [result.rows[0].id]
    );

    res.json({
      ...result.rows[0],
      items: items.rows,
      history: history.rows,
      deliveryAddress: deliveryAddress.rows[0] ?? null,
      payment: payment.rows[0] ?? null
    });
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
    await query(
      "insert into order_status_history (order_id, previous_status, new_status, changed_by, notes) values ($1,$2,$3,$4,$5)",
      [req.params.id, current.rows[0]?.order_status, status, req.admin?.sub, notes ?? null]
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get("/products", async (_req, res) => res.json(await listAdminProducts()));
adminRoutes.get("/products/:id", async (req, res, next) => {
  try {
    res.json(await getAdminProductById(String(req.params.id)));
  } catch (error) {
    next(error);
  }
});
adminRoutes.post("/products", productUpload.array("images", 10), async (req, res, next) => {
  try {
    const payload = parseProductPayload(req.body as Record<string, unknown>);
    const files = ((req.files as Express.Multer.File[] | undefined) ?? []).map((file) => ({ filename: file.filename }));
    res.status(201).json(await createProduct(payload, files, req.admin?.sub));
  } catch (error) {
    logProductMutationError("create", req.admin?.sub, req.body as Record<string, unknown>, error);
    next(error);
  }
});
adminRoutes.put("/products/:id", productUpload.array("images", 10), async (req, res, next) => {
  try {
    const payload = parseProductPayload(req.body as Record<string, unknown>);
    const files = ((req.files as Express.Multer.File[] | undefined) ?? []).map((file) => ({ filename: file.filename }));
    res.json(await updateProduct(String(req.params.id), payload, files, req.admin?.sub));
  } catch (error) {
    logProductMutationError("update", req.admin?.sub, req.body as Record<string, unknown>, error);
    next(error);
  }
});
adminRoutes.patch("/products/:id/images/:imageId/primary", async (req, res, next) => {
  try {
    res.json(await setPrimaryProductImage(String(req.params.id), String(req.params.imageId)));
  } catch (error) {
    next(error);
  }
});
adminRoutes.patch("/products/:id/images/reorder", async (req, res, next) => {
  try {
    const imageOrder = z.array(z.string().uuid()).parse(req.body?.imageOrder ?? []);
    res.json(await reorderProductImages(String(req.params.id), imageOrder));
  } catch (error) {
    next(error);
  }
});
adminRoutes.delete("/products/:id/images/:imageId", async (req, res, next) => {
  try {
    res.json(await deleteProductImage(String(req.params.id), String(req.params.imageId)));
  } catch (error) {
    next(error);
  }
});
adminRoutes.delete("/products/:id", async (req, res, next) => {
  try {
    await query("update products set status = 'ARCHIVED', updated_at = now() where id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get("/categories", async (_req, res) => res.json(await listCategories()));
adminRoutes.post("/categories", async (req, res, next) => {
  try {
    const payload = z.object({
      name: z.string().trim().min(1),
      slug: z.string().trim().min(1),
      description: z.string().trim().default(""),
      imageUrl: z.string().trim().default(""),
      status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE")
    }).parse(req.body);

    const result = await query(
      `insert into categories (name, slug, description, image_url, status, created_at, updated_at)
       values ($1, $2, $3, $4, $5, now(), now())
       returning *`,
      [payload.name, payload.slug, payload.description, payload.imageUrl || null, payload.status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});
adminRoutes.put("/categories/:id", async (req, res, next) => {
  try {
    const payload = z.object({
      name: z.string().trim().min(1),
      slug: z.string().trim().min(1),
      description: z.string().trim().default(""),
      imageUrl: z.string().trim().default(""),
      status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE")
    }).parse(req.body);

    const result = await query(
      `update categories
       set name = $1, slug = $2, description = $3, image_url = $4, status = $5, updated_at = now()
       where id = $6
       returning *`,
      [payload.name, payload.slug, payload.description, payload.imageUrl || null, payload.status, req.params.id]
    );
    if (!result.rows[0]) throw new AppError(404, "Category not found.");
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

adminRoutes.get("/inventory", async (_req, res, next) => {
  try {
    const result = await query("select im.*, p.name from inventory_movements im join products p on p.id = im.product_id order by im.created_at desc limit 100");
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});
adminRoutes.post("/inventory/adjust", async (req, res, next) => {
  try {
    const payload = z.object({
      productId: z.string().uuid(),
      movementType: z.enum(["STOCK_IN", "ADJUSTMENT", "DAMAGED"]),
      quantity: z.coerce.number().int().positive(),
      reason: z.string().trim().optional().default(""),
      reference: z.string().trim().optional().default("")
    }).parse(req.body);

    res.status(201).json(await adjustInventory({ ...payload, createdBy: req.admin?.sub }));
  } catch (error) {
    next(error);
  }
});

adminRoutes.get("/customers", async (_req, res, next) => {
  try {
    const result = await query("select * from customers order by created_at desc limit 100");
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

adminRoutes.get("/reports", (_req, res) => res.json({ sales: [], inventory: [], customers: [] }));

adminRoutes.get("/settings", async (_req, res, next) => {
  try {
    res.json(await getSiteSettings());
  } catch (error) {
    next(error);
  }
});

adminRoutes.put("/settings", async (req, res, next) => {
  try {
    res.json(await updateSiteSettings(req.body ?? {}, req.admin!.sub));
  } catch (error) {
    next(error);
  }
});

adminRoutes.post("/settings/media/:slot", siteUpload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(400, "Image file is required.");

    const mediaSlotMap = {
      logo: "logoUrl",
      homeBackground: "heroHomeBg",
      homeModel: "heroHomeModel",
      shopHero: "heroShop",
      aboutHero: "heroAbout",
      contactHero: "heroContact",
      cartHero: "heroCart",
      checkoutHero: "heroCheckout",
      trackOrderHero: "heroTrackOrder",
      productHero: "heroProduct",
      adminLoginHero: "heroAdminLogin",
      homePromoBanner: "homePromoBanner",
      categoryWomen: "categoryWomen",
      categoryMen: "categoryMen",
      categoryShoes: "categoryShoes",
      categoryAccessories: "categoryAccessories"
    } as const;

    const slot = String(req.params.slot ?? "");
    const key = mediaSlotMap[slot as keyof typeof mediaSlotMap];
    if (!key) throw new AppError(400, "Unknown media slot.");

    const uploadUrl = `/uploads/site/${req.file.filename}`;
    res.json(await updateSiteSettings({ [key]: uploadUrl }, req.admin!.sub));
  } catch (error) {
    next(error);
  }
});

adminRoutes.get("/subscribers", async (req, res, next) => {
  try {
    const status = String(req.query.status ?? "ALL").toUpperCase();
    const search = String(req.query.search ?? "").trim().toLowerCase();
    const values: unknown[] = [];
    const conditions: string[] = [];

    if (status !== "ALL") {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }
    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(coalesce(name, '') ilike $${values.length} or whatsapp_number ilike $${values.length})`);
    }

    const sql = `select * from stock_alert_subscribers ${conditions.length ? `where ${conditions.join(" and ")}` : ""} order by created_at desc limit 500`;
    const result = await query(sql, values);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

adminRoutes.patch("/subscribers/:id/status", async (req, res, next) => {
  try {
    const status = String(req.body?.status ?? "").toUpperCase();
    if (!["ACTIVE", "UNSUBSCRIBED", "INACTIVE"].includes(status)) throw new AppError(400, "Invalid subscriber status.");
    const result = await query("update stock_alert_subscribers set status = $1, updated_at = now() where id = $2 returning *", [status, req.params.id]);
    if (!result.rows[0]) throw new AppError(404, "Subscriber not found.");
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

adminRoutes.post("/subscribers/send", async (req, res, next) => {
  try {
    const target = String(req.body?.target ?? "selected");
    const subscriberIds = Array.isArray(req.body?.subscriberIds) ? req.body.subscriberIds.map(String) : [];
    const templateName = String(req.body?.templateName ?? "stock_alert");
    const product = String(req.body?.product ?? "").trim();
    const customNote = String(req.body?.customNote ?? "").trim();

    let subscribers: Array<{ id: string; name: string | null; whatsapp_number: string; opted_in: boolean; status: "ACTIVE" | "UNSUBSCRIBED" | "INACTIVE" }> = [];

    if (target === "all") {
      const result = await query("select id, name, whatsapp_number, opted_in, status from stock_alert_subscribers order by created_at desc");
      subscribers = result.rows as typeof subscribers;
    } else if (target === "individual" || target === "selected") {
      if (!subscriberIds.length) throw new AppError(400, "Select at least one subscriber.");
      const placeholders = subscriberIds.map((_: string, index: number) => `$${index + 1}`).join(", ");
      const result = await query(`select id, name, whatsapp_number, opted_in, status from stock_alert_subscribers where id in (${placeholders})`, subscriberIds);
      subscribers = result.rows as typeof subscribers;
    } else {
      throw new AppError(400, "Unknown send target.");
    }

    const eligible = filterEligibleSubscribers(subscribers);
    const messageBody = [product ? `New stock update: ${product}` : "New White Angels stock update", customNote].filter(Boolean).join("\n\n");

    const results: Array<{ subscriberId: string } & Awaited<ReturnType<typeof sendStockAlertMessage>>> = [];
    for (const subscriber of eligible) {
      const sendResult = await sendStockAlertMessage({
        phoneNumber: subscriber.whatsapp_number,
        templateName,
        messageBody
      });

      if (sendResult.ok) {
        await query(
          "insert into whatsapp_notification_logs (subscriber_id, message_type, template_name, status, provider_message_id, sent_by, sent_at) values ($1, 'STOCK_ALERT', $2, 'SENT', $3, $4, now())",
          [subscriber.id, templateName, sendResult.providerMessageId, req.admin?.sub]
        );
        await query("update stock_alert_subscribers set last_notification_at = now(), updated_at = now() where id = $1", [subscriber.id]);
      } else {
        await query(
          "insert into whatsapp_notification_logs (subscriber_id, message_type, template_name, status, error_message, sent_by) values ($1, 'STOCK_ALERT', $2, 'FAILED', $3, $4)",
          [subscriber.id, templateName, sendResult.message, req.admin?.sub]
        );
      }

      results.push({ subscriberId: subscriber.id, ...sendResult });
    }

    const ineligible = subscribers.filter((subscriber) => !canReceiveStockAlert(subscriber));
    res.json({
      target,
      eligibleCount: eligible.length,
      skippedCount: ineligible.length,
      skippedSubscriberIds: ineligible.map((subscriber) => subscriber.id),
      results,
      ...(results.some((item) => !item.ok && item.code === "WHATSAPP_NOT_CONFIGURED")
        ? { requiredEnvVars: getRequiredWhatsAppVariables() }
        : {})
    });
  } catch (error) {
    next(error);
  }
});

function logProductMutationError(operation: "create" | "update", adminId: string | undefined, body: Record<string, unknown>, error: unknown) {
  const category = typeof body.categoryId === "string" && body.categoryId.trim()
    ? body.categoryId.trim()
    : typeof body.category === "string"
      ? body.category.trim()
      : "";

  const safeError = error instanceof AppError
    ? { status: error.status, message: error.message }
    : error instanceof z.ZodError
      ? { status: 422, message: error.issues[0]?.message ?? "Validation failed." }
      : error instanceof Error
        ? { status: 500, message: error.message }
        : { status: 500, message: "Unknown error" };

  console.error("[admin-products]", {
    operation,
    adminId: adminId ?? null,
    sku: typeof body.sku === "string" ? body.sku.trim() : "",
    slug: typeof body.slug === "string" ? body.slug.trim() : "",
    name: typeof body.name === "string" ? body.name.trim() : "",
    category,
    error: safeError
  });
}
