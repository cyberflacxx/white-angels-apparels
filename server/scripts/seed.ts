import { randomUUID } from "node:crypto";
import { appSchema, requirePool, searchPath, shutdownPool } from "../src/db/pool.js";
import { fallbackCategories, fallbackProducts } from "../src/services/catalogService.js";

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_DEMO_SEED !== "true") {
    console.log("Production demo seed skipped. Set ALLOW_PRODUCTION_DEMO_SEED=true only if demo products are explicitly required.");
    return;
  }
  const pool = requirePool();
  await pool.query(`set search_path to ${searchPath}`);
  const schemaCheck = await pool.query("select current_schema() as schema");
  if (schemaCheck.rows[0]?.schema !== appSchema) throw new Error(`Wrong schema for seed: ${schemaCheck.rows[0]?.schema}`);
  for (const category of fallbackCategories) {
    await pool.query("insert into categories (id, name, slug, description, image_url, status) values ($1,$2,$3,$4,$5,$6) on conflict (slug) do nothing", [category.id, category.name, category.slug, category.description, category.image_url, category.status]);
  }
  for (const product of fallbackProducts) {
    await pool.query(
      `insert into products (id, name, slug, sku, category_id, short_description, description, price, previous_price, stock_quantity, low_stock_threshold, status, featured, new_arrival)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) on conflict (sku) do nothing`,
      [product.id, product.name, product.slug, product.sku, product.category_id, product.short_description, product.description, product.price, product.previous_price, product.stock_quantity, product.low_stock_threshold, product.status, product.featured, product.new_arrival]
    );
    await pool.query("insert into product_images (id, product_id, image_url, alt_text, sort_order, is_primary) values ($1,$2,$3,$4,0,true) on conflict do nothing", [randomUUID(), product.id, product.image_url, product.name]);
  }
  console.log("Development catalog seed complete.");
}

main().finally(shutdownPool);
