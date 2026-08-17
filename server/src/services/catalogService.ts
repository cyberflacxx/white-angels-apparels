import { query } from "../db/pool.js";
import { env } from "../config/env.js";

export const fallbackCategories = [
  { id: "b201a08b-b5ab-4b41-b9f4-b4338c7de101", name: "Dresses", slug: "dresses", description: "Elegant dresses", image_url: "/images/hero-shop.jpg", status: "ACTIVE" },
  { id: "b201a08b-b5ab-4b41-b9f4-b4338c7de102", name: "Tops", slug: "tops", description: "Premium tops", image_url: "/images/hero-product.jpg", status: "ACTIVE" },
  { id: "b201a08b-b5ab-4b41-b9f4-b4338c7de103", name: "Accessories", slug: "accessories", description: "Finishing touches", image_url: "/images/hero-about.jpg", status: "ACTIVE" }
];

export const fallbackProducts = [
  ["Angel Satin Dress", "angel-satin-dress", "WA-DR-001", "Dresses", "68.00", "82.00", 12, true, true],
  ["Ivory Tailored Blazer", "ivory-tailored-blazer", "WA-BL-002", "Tops", "94.00", null, 7, true, false],
  ["Pearl Knit Set", "pearl-knit-set", "WA-KN-003", "Tops", "55.00", "63.00", 9, false, true],
  ["Gold Accent Belt", "gold-accent-belt", "WA-AC-004", "Accessories", "22.00", null, 20, true, false],
  ["Cloud Linen Shirt", "cloud-linen-shirt", "WA-SH-005", "Tops", "39.00", null, 15, false, true],
  ["Noir Evening Dress", "noir-evening-dress", "WA-DR-006", "Dresses", "76.00", "89.00", 5, true, false],
  ["Silk Touch Scarf", "silk-touch-scarf", "WA-AC-007", "Accessories", "18.00", null, 30, false, true],
  ["Rose Midi Dress", "rose-midi-dress", "WA-DR-008", "Dresses", "62.00", null, 10, true, true]
].map(([name, slug, sku, category, price, previous_price, stock, featured, new_arrival], index) => {
  const categoryRecord = fallbackCategories.find((item) => item.name === category)!;
  return {
    id: `b301a08b-b5ab-4b41-b9f4-b4338c7de10${index + 1}`,
    name: String(name),
    slug: String(slug),
    sku: String(sku),
    category_id: categoryRecord.id,
    category_name: String(category),
    price: String(price),
    previous_price: previous_price ? String(previous_price) : null,
    stock_quantity: Number(stock),
    low_stock_threshold: 3,
    status: "ACTIVE",
    featured: Boolean(featured),
    new_arrival: Boolean(new_arrival),
    image_url: `/images/${index % 2 === 0 ? "hero-product" : "hero-shop"}.jpg`,
    short_description: "Premium fashion piece for the White Angels collection.",
    description: "A polished first-version product description ready for richer merchandising content."
  };
});

export async function listCategories() {
  try {
    const result = await query("select * from categories where status = 'ACTIVE' order by name");
    return result.rows;
  } catch {
    if (env.NODE_ENV === "production") return [];
    return fallbackCategories;
  }
}

export async function listProducts(filters: { category?: string; search?: string; sort?: string; featured?: boolean; newArrival?: boolean } = {}) {
  try {
    const params: unknown[] = [];
    const where = ["p.status = 'ACTIVE'"];
    if (filters.category) {
      params.push(filters.category);
      where.push(`c.slug = $${params.length}`);
    }
    if (filters.search) {
      params.push(`%${filters.search}%`);
      where.push(`(p.name ilike $${params.length} or p.description ilike $${params.length})`);
    }
    if (filters.featured) where.push("p.featured = true");
    if (filters.newArrival) where.push("p.new_arrival = true");
    const sort = filters.sort === "price_asc" ? "p.price asc" : filters.sort === "price_desc" ? "p.price desc" : "p.created_at desc";
    const result = await query(
      `select p.*, c.name as category_name, coalesce(pi.image_url, '/images/hero-product.jpg') as image_url
       from products p join categories c on c.id = p.category_id
       left join product_images pi on pi.product_id = p.id and pi.is_primary = true
       where ${where.join(" and ")} order by ${sort}`,
      params
    );
    return result.rows;
  } catch {
    if (env.NODE_ENV === "production") return [];
    return fallbackProducts;
  }
}

export async function getProductBySlug(slug: string) {
  const fallback = fallbackProducts.find((product) => product.slug === slug);
  try {
    const result = await query(
      `select p.*, c.name as category_name, coalesce(pi.image_url, '/images/hero-product.jpg') as image_url
       from products p join categories c on c.id = p.category_id
       left join product_images pi on pi.product_id = p.id and pi.is_primary = true
       where p.slug = $1 and p.status = 'ACTIVE'`,
      [slug]
    );
    return result.rows[0] ?? (env.NODE_ENV === "production" ? undefined : fallback);
  } catch {
    if (env.NODE_ENV === "production") return undefined;
    return fallback;
  }
}
