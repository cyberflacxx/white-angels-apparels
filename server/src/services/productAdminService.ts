import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { z } from "zod";
import { requirePool, query } from "../db/pool.js";
import { AppError } from "../middleware/error.js";
import { resolveUploadPathFromUrl, toPublicUploadUrl } from "../middleware/upload.js";

const productPayloadSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  sku: z.string().trim().min(1),
  categoryId: z.string().uuid(),
  shortDescription: z.string().trim().default(""),
  description: z.string().trim().default(""),
  price: z.coerce.number().min(0),
  previousPrice: z.union([z.coerce.number().min(0), z.literal(""), z.null(), z.undefined()]).transform((value) =>
    value === "" || value == null ? null : value
  ),
  stockQuantity: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  featured: z.coerce.boolean().default(false),
  newArrival: z.coerce.boolean().default(false),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
  stockChangeType: z.enum(["STOCK_IN", "ADJUSTMENT", "DAMAGED"]).optional(),
  stockChangeReason: z.string().trim().optional().default(""),
  primaryImageId: z.string().uuid().optional(),
  primaryUploadIndex: z.coerce.number().int().min(0).optional(),
  imageOrder: z.array(z.string().uuid()).default([]),
  deletedImageIds: z.array(z.string().uuid()).default([])
});

type ProductPayload = z.infer<typeof productPayloadSchema>;
type UploadedFile = { filename: string };

export function parseProductPayload(input: Record<string, unknown>) {
  return productPayloadSchema.parse({
    name: input.name,
    slug: input.slug,
    sku: input.sku,
    categoryId: input.categoryId,
    shortDescription: input.shortDescription,
    description: input.description,
    price: input.price,
    previousPrice: input.previousPrice,
    stockQuantity: input.stockQuantity,
    lowStockThreshold: input.lowStockThreshold,
    featured: input.featured,
    newArrival: input.newArrival,
    status: input.status,
    stockChangeType: input.stockChangeType,
    stockChangeReason: input.stockChangeReason,
    primaryImageId: input.primaryImageId,
    primaryUploadIndex: input.primaryUploadIndex,
    imageOrder: parseJsonArray(input.imageOrder),
    deletedImageIds: parseJsonArray(input.deletedImageIds)
  });
}

export async function createProduct(payload: ProductPayload, uploadedFiles: UploadedFile[], adminId?: string) {
  const client = await requirePool().connect();
  try {
    await client.query("begin");
    await assertCategoryExists(client, payload.categoryId);
    await ensureUniqueProductFields(client, payload.slug, payload.sku);

    const productId = randomUUID();
    await client.query(
      `insert into products
        (id, name, slug, sku, category_id, short_description, description, price, previous_price, stock_quantity, low_stock_threshold, status, featured, new_arrival, created_at, updated_at)
       values
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now(),now())`,
      [
        productId,
        payload.name,
        payload.slug,
        payload.sku,
        payload.categoryId,
        payload.shortDescription,
        payload.description,
        payload.price.toFixed(2),
        payload.previousPrice == null ? null : payload.previousPrice.toFixed(2),
        payload.stockQuantity,
        payload.lowStockThreshold,
        payload.status,
        payload.featured,
        payload.newArrival
      ]
    );

    if (payload.stockQuantity > 0) {
      await insertInventoryMovement(client, {
        productId,
        movementType: "STOCK_IN",
        quantity: payload.stockQuantity,
        stockBefore: 0,
        stockAfter: payload.stockQuantity,
        notes: payload.stockChangeReason || "Initial stock recorded during product creation.",
        createdBy: adminId
      });
    }

    const uploaded = await insertUploadedImages(client, productId, uploadedFiles);
    await applyPrimaryAndOrdering(client, productId, payload, uploaded);
    await client.query("commit");
    return getAdminProductById(productId);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateProduct(productId: string, payload: ProductPayload, uploadedFiles: UploadedFile[], adminId?: string) {
  const client = await requirePool().connect();
  try {
    await client.query("begin");
    const existing = await lockProduct(client, productId);
    await assertCategoryExists(client, payload.categoryId);
    await ensureUniqueProductFields(client, payload.slug, payload.sku, productId);

    await client.query(
      `update products
       set name = $1, slug = $2, sku = $3, category_id = $4, short_description = $5, description = $6, price = $7, previous_price = $8,
           low_stock_threshold = $9, status = $10, featured = $11, new_arrival = $12, updated_at = now()
       where id = $13`,
      [
        payload.name,
        payload.slug,
        payload.sku,
        payload.categoryId,
        payload.shortDescription,
        payload.description,
        payload.price.toFixed(2),
        payload.previousPrice == null ? null : payload.previousPrice.toFixed(2),
        payload.lowStockThreshold,
        payload.status,
        payload.featured,
        payload.newArrival,
        productId
      ]
    );

    await applyStockChange(client, existing.stock_quantity, payload, productId, adminId);
    await deleteProductImages(client, productId, payload.deletedImageIds);
    const uploaded = await insertUploadedImages(client, productId, uploadedFiles);
    await applyPrimaryAndOrdering(client, productId, payload, uploaded);
    await client.query("commit");
    return getAdminProductById(productId);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function setPrimaryProductImage(productId: string, imageId: string) {
  const client = await requirePool().connect();
  try {
    await client.query("begin");
    await assertImageBelongsToProduct(client, productId, imageId);
    await client.query("update product_images set is_primary = false where product_id = $1", [productId]);
    await client.query("update product_images set is_primary = true where id = $1 and product_id = $2", [imageId, productId]);
    await client.query("commit");
    return listProductImages(productId);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function reorderProductImages(productId: string, imageOrder: string[]) {
  const client = await requirePool().connect();
  try {
    await client.query("begin");
    for (const [index, imageId] of imageOrder.entries()) {
      await assertImageBelongsToProduct(client, productId, imageId);
      await client.query("update product_images set sort_order = $1 where id = $2 and product_id = $3", [index, imageId, productId]);
    }
    await client.query("commit");
    return listProductImages(productId);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteProductImage(productId: string, imageId: string) {
  const client = await requirePool().connect();
  try {
    await client.query("begin");
    const image = await assertImageBelongsToProduct(client, productId, imageId);
    await client.query("delete from product_images where id = $1 and product_id = $2", [imageId, productId]);
    await reassignPrimaryIfNeeded(client, productId);
    await client.query("commit");
    await removeFileForUrl(image.image_url);
    return listProductImages(productId);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function adjustInventory(input: {
  productId: string;
  movementType: "STOCK_IN" | "ADJUSTMENT" | "DAMAGED";
  quantity: number;
  reason?: string;
  reference?: string;
  createdBy?: string;
}) {
  if (input.quantity < 1) throw new AppError(400, "Inventory quantity must be at least 1.");
  const client = await requirePool().connect();
  try {
    await client.query("begin");
    const product = await lockProduct(client, input.productId);
    const delta = input.movementType === "DAMAGED" ? -input.quantity : input.quantity;
    const stockAfter = product.stock_quantity + delta;
    if (stockAfter < 0) throw new AppError(400, "Stock cannot go below zero.");

    await client.query("update products set stock_quantity = $1, updated_at = now() where id = $2", [stockAfter, input.productId]);
    await insertInventoryMovement(client, {
      productId: input.productId,
      movementType: input.movementType,
      quantity: delta,
      stockBefore: product.stock_quantity,
      stockAfter,
      notes: input.reason || "Manual inventory adjustment recorded by admin.",
      reference: input.reference,
      createdBy: input.createdBy
    });
    await client.query("commit");
    return getAdminProductById(input.productId);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function getAdminProductById(productId: string) {
  const productResult = await query(
    `select p.*, c.name as category_name, coalesce(pi.image_url, '/images/site/placeholder-product.jpg') as image_url
     from products p
     join categories c on c.id = p.category_id
     left join product_images pi on pi.product_id = p.id and pi.is_primary = true
     where p.id = $1`,
    [productId]
  );
  if (!productResult.rows[0]) throw new AppError(404, "Product not found.");
  const images = await listProductImages(productId);
  return { ...productResult.rows[0], images };
}

export async function listProductImages(productId: string) {
  const result = await query("select * from product_images where product_id = $1 order by sort_order asc, created_at asc", [productId]);
  return result.rows;
}

async function applyStockChange(client: PoolClient, previousStock: number, payload: ProductPayload, productId: string, adminId?: string) {
  if (payload.stockQuantity === previousStock) return;
  const delta = payload.stockQuantity - previousStock;
  const inferredType: "STOCK_IN" | "ADJUSTMENT" | "DAMAGED" =
    payload.stockChangeType ?? (delta > 0 ? "STOCK_IN" : "ADJUSTMENT");
  if (payload.stockQuantity < 0) throw new AppError(400, "Stock cannot go below zero.");

  await client.query("update products set stock_quantity = $1, updated_at = now() where id = $2", [payload.stockQuantity, productId]);
  await insertInventoryMovement(client, {
    productId,
    movementType: inferredType,
    quantity: delta,
    stockBefore: previousStock,
    stockAfter: payload.stockQuantity,
    notes: payload.stockChangeReason || "Product stock updated by admin.",
    createdBy: adminId
  });
}

async function insertUploadedImages(client: PoolClient, productId: string, uploadedFiles: UploadedFile[]) {
  if (!uploadedFiles.length) return [] as Array<{ id: string; image_url: string }>;
  const maxOrderResult = await client.query<{ sort_order: number | null }>("select max(sort_order) as sort_order from product_images where product_id = $1", [productId]);
  let nextOrder = (maxOrderResult.rows[0]?.sort_order ?? -1) + 1;
  const inserted: Array<{ id: string; image_url: string }> = [];

  for (const file of uploadedFiles) {
    const imageId = randomUUID();
    const imageUrl = toPublicUploadUrl(file.filename, "products");
    const result = await client.query<{ id: string; image_url: string }>(
      `insert into product_images (id, product_id, image_url, sort_order, is_primary, created_at)
       values ($1, $2, $3, $4, false, now())
       returning id, image_url`,
      [imageId, productId, imageUrl, nextOrder]
    );
    inserted.push(result.rows[0]);
    nextOrder += 1;
  }

  return inserted;
}

async function applyPrimaryAndOrdering(
  client: PoolClient,
  productId: string,
  payload: ProductPayload,
  uploaded: Array<{ id: string; image_url: string }>
) {
  if (payload.imageOrder.length) {
    for (const [index, imageId] of payload.imageOrder.entries()) {
      await assertImageBelongsToProduct(client, productId, imageId);
      await client.query("update product_images set sort_order = $1 where id = $2 and product_id = $3", [index, imageId, productId]);
    }
  }

  let primaryId = payload.primaryImageId ?? "";
  if (!primaryId && uploaded.length && typeof payload.primaryUploadIndex === "number") {
    primaryId = uploaded[payload.primaryUploadIndex]?.id ?? "";
  }
  if (!primaryId) {
    const existingPrimary = await client.query<{ id: string }>("select id from product_images where product_id = $1 and is_primary = true limit 1", [productId]);
    if (!existingPrimary.rows[0] && uploaded[0]) primaryId = uploaded[0].id;
  }

  if (primaryId) {
    await assertImageBelongsToProduct(client, productId, primaryId);
    await client.query("update product_images set is_primary = false where product_id = $1", [productId]);
    await client.query("update product_images set is_primary = true where id = $1 and product_id = $2", [primaryId, productId]);
  }
}

async function deleteProductImages(client: PoolClient, productId: string, imageIds: string[]) {
  if (!imageIds.length) return;
  const rows = await client.query<{ id: string; image_url: string }>("select id, image_url from product_images where product_id = $1 and id = any($2::uuid[])", [productId, imageIds]);
  await client.query("delete from product_images where product_id = $1 and id = any($2::uuid[])", [productId, imageIds]);
  await reassignPrimaryIfNeeded(client, productId);

  for (const row of rows.rows) {
    await removeFileForUrl(row.image_url);
  }
}

async function reassignPrimaryIfNeeded(client: PoolClient, productId: string) {
  const primaryResult = await client.query("select id from product_images where product_id = $1 and is_primary = true limit 1", [productId]);
  if (primaryResult.rows[0]) return;
  const fallback = await client.query<{ id: string }>("select id from product_images where product_id = $1 order by sort_order asc, created_at asc limit 1", [productId]);
  if (fallback.rows[0]) {
    await client.query("update product_images set is_primary = true where id = $1 and product_id = $2", [fallback.rows[0].id, productId]);
  }
}

async function assertCategoryExists(client: PoolClient, categoryId: string) {
  const result = await client.query("select id from categories where id = $1 and status = 'ACTIVE'", [categoryId]);
  if (!result.rows[0]) throw new AppError(400, "Selected category does not exist.");
}

async function ensureUniqueProductFields(client: PoolClient, slug: string, sku: string, productId?: string) {
  const slugResult = await client.query("select id from products where lower(slug) = lower($1) and ($2::uuid is null or id <> $2)", [slug, productId ?? null]);
  if (slugResult.rows[0]) throw new AppError(409, "Product slug already exists.");
  const skuResult = await client.query("select id from products where lower(sku) = lower($1) and ($2::uuid is null or id <> $2)", [sku, productId ?? null]);
  if (skuResult.rows[0]) throw new AppError(409, "Product SKU already exists.");
}

async function lockProduct(client: PoolClient, productId: string) {
  const result = await client.query<{ id: string; stock_quantity: number }>("select id, stock_quantity from products where id = $1 for update", [productId]);
  if (!result.rows[0]) throw new AppError(404, "Product not found.");
  return result.rows[0];
}

async function assertImageBelongsToProduct(client: PoolClient, productId: string, imageId: string) {
  const result = await client.query<{ id: string; image_url: string }>("select id, image_url from product_images where id = $1 and product_id = $2", [imageId, productId]);
  if (!result.rows[0]) throw new AppError(404, "Product image not found.");
  return result.rows[0];
}

async function insertInventoryMovement(
  client: PoolClient,
  input: {
    productId: string;
    movementType: "STOCK_IN" | "ADJUSTMENT" | "DAMAGED";
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    notes: string;
    reference?: string;
    createdBy?: string;
  }
) {
  await client.query(
    `insert into inventory_movements (id, product_id, movement_type, quantity, stock_before, stock_after, reference, notes, created_by, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())`,
    [randomUUID(), input.productId, input.movementType, input.quantity, input.stockBefore, input.stockAfter, input.reference ?? null, input.notes, input.createdBy ?? null]
  );
}

async function removeFileForUrl(url: string) {
  const filePath = resolveUploadPathFromUrl(url);
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch {
    return;
  }
}

function parseJsonArray(input: unknown) {
  if (Array.isArray(input)) return input.map(String);
  if (typeof input !== "string" || !input.trim()) return [];
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
