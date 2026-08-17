set search_path to white_angels_apparels, pg_catalog;

alter table white_angels_apparels.site_settings
  add column if not exists hero_product_image_url text not null default '/images/site/hero-product.jpg',
  add column if not exists home_promo_banner_url text not null default '/images/site/banner-home-promo.jpg';

update white_angels_apparels.site_settings
set
  logo_url = coalesce(nullif(logo_url, ''), '/images/site/logo-white-angels.png'),
  hero_home_image_url = coalesce(nullif(hero_home_image_url, ''), '/images/site/hero-home-bg.jpg'),
  hero_home_side_image_url = coalesce(nullif(hero_home_side_image_url, ''), '/images/site/hero-home-model.jpg'),
  hero_shop_image_url = coalesce(nullif(hero_shop_image_url, ''), '/images/site/hero-shop.jpg'),
  hero_about_image_url = coalesce(nullif(hero_about_image_url, ''), '/images/site/hero-about.jpg'),
  hero_contact_image_url = coalesce(nullif(hero_contact_image_url, ''), '/images/site/hero-contact.jpg'),
  hero_cart_image_url = coalesce(nullif(hero_cart_image_url, ''), '/images/site/hero-cart.jpg'),
  hero_checkout_image_url = coalesce(nullif(hero_checkout_image_url, ''), '/images/site/hero-checkout.jpg'),
  hero_track_order_image_url = coalesce(nullif(hero_track_order_image_url, ''), '/images/site/hero-track-order.jpg'),
  hero_admin_login_image_url = coalesce(nullif(hero_admin_login_image_url, ''), '/images/site/hero-admin-login.jpg'),
  hero_product_image_url = coalesce(nullif(hero_product_image_url, ''), '/images/site/hero-product.jpg'),
  home_promo_banner_url = coalesce(nullif(home_promo_banner_url, ''), '/images/site/banner-home-promo.jpg')
where true;
