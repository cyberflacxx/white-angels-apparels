import { siteSettings as envSiteSettings } from "../config/env.js";
import { query } from "../db/pool.js";

export type SiteSettingsRecord = typeof envSiteSettings & {
  id?: string;
};

const settingColumns = [
  "shop_name",
  "logo_text",
  "logo_url",
  "phone",
  "email",
  "address",
  "whatsapp_channel_url",
  "facebook_url",
  "instagram_url",
  "tiktok_url",
  "hero_home_image_url",
  "hero_home_side_image_url",
  "hero_shop_image_url",
  "hero_about_image_url",
  "hero_contact_image_url",
  "hero_cart_image_url",
  "hero_checkout_image_url",
  "hero_track_order_image_url",
  "hero_product_image_url",
  "hero_admin_login_image_url",
  "home_promo_banner_url",
  "opening_hours",
  "ecocash_merchant_name",
  "ecocash_merchant_number",
  "collection_instructions",
  "default_delivery_fee"
] as const;

export async function getSiteSettings() {
  try {
    const result = await query(`select * from site_settings order by created_at asc limit 1`);
    return normalizeSiteSettingsRow(result.rows[0]);
  } catch {
    return envSiteSettings;
  }
}

export async function updateSiteSettings(input: Partial<SiteSettingsRecord>, adminId: string) {
  const existingResult = await query(`select * from site_settings order by created_at asc limit 1`);
  const existing = normalizeSiteSettingsRow(existingResult.rows[0]);

  const next = {
    shop_name: input.shopName ?? existing.shopName,
    logo_text: input.logo ?? existing.logo,
    logo_url: input.logoUrl ?? existing.logoUrl,
    phone: input.phone ?? existing.phone,
    email: input.email ?? existing.email,
    address: input.address ?? existing.address,
    whatsapp_channel_url: input.whatsapp ?? existing.whatsapp,
    facebook_url: input.facebook ?? existing.facebook,
    instagram_url: input.instagram ?? existing.instagram,
    tiktok_url: input.tiktok ?? existing.tiktok,
    hero_home_image_url: input.heroHomeBg ?? existing.heroHomeBg,
    hero_home_side_image_url: input.heroHomeModel ?? existing.heroHomeModel,
    hero_shop_image_url: input.heroShop ?? existing.heroShop,
    hero_about_image_url: input.heroAbout ?? existing.heroAbout,
    hero_contact_image_url: input.heroContact ?? existing.heroContact,
    hero_cart_image_url: input.heroCart ?? existing.heroCart,
    hero_checkout_image_url: input.heroCheckout ?? existing.heroCheckout,
    hero_track_order_image_url: input.heroTrackOrder ?? existing.heroTrackOrder,
    hero_product_image_url: input.heroProduct ?? existing.heroProduct,
    hero_admin_login_image_url: input.heroAdminLogin ?? existing.heroAdminLogin,
    home_promo_banner_url: input.homePromoBanner ?? existing.homePromoBanner,
    opening_hours: input.openingHours ?? existing.openingHours,
    ecocash_merchant_name: input.ecocashMerchantName ?? existing.ecocashMerchantName,
    ecocash_merchant_number: input.ecocashMerchantNumber ?? existing.ecocashMerchantNumber,
    collection_instructions: input.collectionInstructions ?? existing.collectionInstructions,
    default_delivery_fee: input.defaultDeliveryFee ?? existing.defaultDeliveryFee,
    updated_by: adminId
  };

  const setAssignments = settingColumns.map((column) => `${column} = excluded.${column}`).join(", ");
  const values = [
    next.shop_name,
    next.logo_text,
    next.logo_url,
    next.phone,
    next.email,
    next.address,
    next.whatsapp_channel_url,
    next.facebook_url,
    next.instagram_url,
    next.tiktok_url,
    next.hero_home_image_url,
    next.hero_home_side_image_url,
    next.hero_shop_image_url,
    next.hero_about_image_url,
    next.hero_contact_image_url,
    next.hero_cart_image_url,
    next.hero_checkout_image_url,
    next.hero_track_order_image_url,
    next.hero_product_image_url,
    next.hero_admin_login_image_url,
    next.home_promo_banner_url,
    next.opening_hours,
    next.ecocash_merchant_name,
    next.ecocash_merchant_number,
    next.collection_instructions,
    next.default_delivery_fee,
    adminId
  ];

  const result = await query(
    `insert into site_settings (${settingColumns.join(", ")}, updated_by)
     values (${values.map((_, index) => `$${index + 1}`).join(", ")})
     on conflict ((singleton))
     do update set ${setAssignments}, updated_by = excluded.updated_by, updated_at = now()
     returning *`,
    values
  );

  return normalizeSiteSettingsRow(result.rows[0]);
}

export function normalizeSiteSettingsRow(row: Record<string, unknown> | undefined): SiteSettingsRecord {
  if (!row) return envSiteSettings;

  return {
    id: readText(row.id),
    shopName: readText(row.shop_name, envSiteSettings.shopName),
    logo: readText(row.logo_text, envSiteSettings.logo),
    logoUrl: readText(row.logo_url),
    phone: readText(row.phone),
    email: readText(row.email),
    address: readText(row.address),
    whatsapp: readText(row.whatsapp_channel_url, envSiteSettings.whatsapp),
    facebook: readText(row.facebook_url),
    instagram: readText(row.instagram_url),
    tiktok: readText(row.tiktok_url),
    heroHomeBg: readText(row.hero_home_image_url, envSiteSettings.heroHomeBg),
    heroHomeModel: readText(row.hero_home_side_image_url, envSiteSettings.heroHomeModel),
    heroShop: readText(row.hero_shop_image_url, envSiteSettings.heroShop),
    heroAbout: readText(row.hero_about_image_url, envSiteSettings.heroAbout),
    heroContact: readText(row.hero_contact_image_url, envSiteSettings.heroContact),
    heroCart: readText(row.hero_cart_image_url, envSiteSettings.heroCart),
    heroCheckout: readText(row.hero_checkout_image_url, envSiteSettings.heroCheckout),
    heroTrackOrder: readText(row.hero_track_order_image_url, envSiteSettings.heroTrackOrder),
    heroProduct: readText(row.hero_product_image_url, envSiteSettings.heroProduct),
    heroAdminLogin: readText(row.hero_admin_login_image_url, envSiteSettings.heroAdminLogin),
    homePromoBanner: readText(row.home_promo_banner_url, envSiteSettings.homePromoBanner),
    openingHours: readText(row.opening_hours),
    ecocashMerchantName: readText(row.ecocash_merchant_name),
    ecocashMerchantNumber: readText(row.ecocash_merchant_number),
    collectionInstructions: readText(row.collection_instructions, envSiteSettings.collectionInstructions),
    defaultDeliveryFee: typeof row.default_delivery_fee === "number" ? row.default_delivery_fee : envSiteSettings.defaultDeliveryFee
  };
}

function readText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}
