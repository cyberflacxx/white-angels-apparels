import { beforeEach, describe, expect, it, vi } from "vitest";

const connectMock = vi.fn();
const pooledQueryMock = vi.fn();

vi.mock("../db/pool.js", () => ({
  requirePool: () => ({
    connect: connectMock
  }),
  query: pooledQueryMock
}));

vi.mock("../middleware/upload.js", () => ({
  resolveUploadPathFromUrl: vi.fn(),
  toPublicUploadUrl: (filename: string, bucket: string) => `/uploads/${bucket}/${filename}`
}));

const {
  createProduct,
  parseProductPayload,
  updateProduct
} = await import("../services/productAdminService.js");

function buildClient(options?: {
  categoryExists?: boolean;
  duplicateSlug?: boolean;
  duplicateSku?: boolean;
  existingStock?: number;
}) {
  const state = {
    committed: false,
    rolledBack: false,
    product: null as null | Record<string, unknown>
  };

  const client = {
    query: vi.fn(async (sql: string, params: unknown[] = []) => {
      if (sql === "begin" || sql === "commit") {
        if (sql === "commit") state.committed = true;
        return { rows: [] };
      }

      if (sql === "rollback") {
        state.rolledBack = true;
        return { rows: [] };
      }

      if (sql.includes("select id from categories where (id::text = $1 or lower(slug) = lower($1))")) {
        return { rows: options?.categoryExists === false ? [] : [{ id: "cat-men-1" }] };
      }

      if (sql.includes("select id from products where lower(slug) = lower($1)")) {
        return { rows: options?.duplicateSlug ? [{ id: "prod-1" }] : [] };
      }

      if (sql.includes("select id from products where lower(sku) = lower($1)")) {
        return { rows: options?.duplicateSku ? [{ id: "prod-2" }] : [] };
      }

      if (sql.includes("insert into products")) {
        state.product = {
          id: String(params[0]),
          name: params[1],
          slug: params[2],
          sku: params[3],
          category_id: params[4],
          short_description: params[5],
          description: params[6],
          price: params[7],
          previous_price: params[8],
          stock_quantity: params[9],
          low_stock_threshold: params[10],
          status: params[11],
          featured: params[12],
          new_arrival: params[13]
        };
        return { rows: [] };
      }

      if (sql.includes("select id, stock_quantity from products where id = $1 for update")) {
        return { rows: [{ id: String(params[0]), stock_quantity: options?.existingStock ?? 6 }] };
      }

      if (sql.includes("update products")) {
        state.product = {
          id: String(params[12]),
          name: params[0],
          slug: params[1],
          sku: params[2],
          category_id: params[3],
          short_description: params[4],
          description: params[5],
          price: params[6],
          previous_price: params[7],
          stock_quantity: options?.existingStock ?? 6,
          low_stock_threshold: params[8],
          status: params[9],
          featured: params[10],
          new_arrival: params[11]
        };
        return { rows: [] };
      }

      if (sql.includes("insert into inventory_movements")) {
        return { rows: [] };
      }

      if (sql.includes("select max(sort_order)")) {
        return { rows: [{ sort_order: null }] };
      }

      if (sql.includes("select id from product_images where product_id = $1 and is_primary = true")) {
        return { rows: [] };
      }

      if (sql.includes("select id from product_images where product_id = $1 order by sort_order asc")) {
        return { rows: [] };
      }

      if (sql.includes("delete from product_images")) {
        return { rows: [] };
      }

      if (sql.includes("select id, image_url from product_images")) {
        return { rows: [] };
      }

      throw new Error(`Unhandled SQL in productAdminService test: ${sql}`);
    }),
    release: vi.fn()
  };

  connectMock.mockResolvedValue(client);
  pooledQueryMock.mockImplementation(async (sql: string) => {
    if (sql.includes("select p.*, c.name as category_name")) {
      return {
        rows: state.product
          ? [{ ...state.product, category_name: "Men", image_url: "/images/site/placeholder-product.jpg" }]
          : []
      };
    }

    if (sql.includes("select * from product_images")) {
      return { rows: [] };
    }

    throw new Error(`Unhandled pooled SQL in productAdminService test: ${sql}`);
  });

  return { client, state };
}

describe("parseProductPayload", () => {
  it("auto-generates the slug, accepts blank previous price, and preserves false booleans", () => {
    const payload = parseProductPayload({
      name: "Men Complete Garment",
      sku: "001",
      category: "men",
      price: "35",
      previousPrice: "",
      stockQuantity: "20",
      lowStockThreshold: "10",
      featured: "false",
      newArrival: "false",
      description: "Complete set"
    });

    expect(payload.slug).toBe("men-complete-garment");
    expect(payload.previousPrice).toBeNull();
    expect(payload.featured).toBe(false);
    expect(payload.newArrival).toBe(false);
    expect(payload.categoryId).toBe("men");
  });

  it("rejects missing required fields", () => {
    expect(() => parseProductPayload({
      name: "",
      sku: "",
      categoryId: "",
      price: "35",
      stockQuantity: "20"
    })).toThrow(/required/i);
  });

  it("rejects invalid numeric values", () => {
    expect(() => parseProductPayload({
      name: "Garmet",
      sku: "001",
      categoryId: "men",
      price: "-1",
      stockQuantity: "-3",
      lowStockThreshold: "-1"
    })).toThrow();
  });
});

describe("productAdminService mutations", () => {
  beforeEach(() => {
    connectMock.mockReset();
    pooledQueryMock.mockReset();
  });

  it("creates a valid product", async () => {
    const { state } = buildClient();

    const result = await createProduct(
      parseProductPayload({
        name: "Garmet",
        sku: "001",
        category: "men",
        price: "35",
        previousPrice: "40",
        stockQuantity: "20",
        lowStockThreshold: "10",
        description: "Complete set"
      }),
      [],
      "admin-1"
    );

    expect(result.slug).toBe("garmet");
    expect(result.sku).toBe("001");
    expect(state.committed).toBe(true);
  });

  it("rejects duplicate SKU with a friendly message", async () => {
    buildClient({ duplicateSku: true });

    await expect(
      createProduct(
        parseProductPayload({
          name: "Garmet",
          sku: "001",
          category: "men",
          price: "35",
          stockQuantity: "20",
          lowStockThreshold: "10"
        }),
        [],
        "admin-1"
      )
    ).rejects.toThrow(/SKU 001/i);
  });

  it("rejects duplicate slug with a friendly message", async () => {
    buildClient({ duplicateSlug: true });

    await expect(
      createProduct(
        parseProductPayload({
          name: "Garmet",
          sku: "WA-002",
          category: "men",
          price: "35",
          stockQuantity: "20",
          lowStockThreshold: "10"
        }),
        [],
        "admin-1"
      )
    ).rejects.toThrow(/URL slug/i);
  });

  it("rejects an invalid category", async () => {
    buildClient({ categoryExists: false });

    await expect(
      createProduct(
        parseProductPayload({
          name: "Garmet",
          sku: "WA-002",
          category: "invalid-category",
          price: "35",
          stockQuantity: "20",
          lowStockThreshold: "10"
        }),
        [],
        "admin-1"
      )
    ).rejects.toThrow(/valid product category/i);
  });

  it("updates a product successfully", async () => {
    const { state } = buildClient({ existingStock: 8 });

    const result = await updateProduct(
      "prod-1",
      parseProductPayload({
        name: "Garmet Updated",
        slug: "garmet-updated",
        sku: "WA-003",
        categoryId: "cat-men-1",
        price: "45",
        previousPrice: "",
        stockQuantity: "8",
        lowStockThreshold: "4",
        description: "Updated description"
      }),
      [],
      "admin-1"
    );

    expect(result.name).toBe("Garmet Updated");
    expect(state.committed).toBe(true);
    expect(state.rolledBack).toBe(false);
  });
});
