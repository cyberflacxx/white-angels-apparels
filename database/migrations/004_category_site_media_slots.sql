set search_path to white_angels_apparels, pg_catalog;

alter table white_angels_apparels.site_settings
  add column if not exists category_women_image_url text not null default '/images/site/category-women.jpg',
  add column if not exists category_men_image_url text not null default '/images/site/category-men.jpg',
  add column if not exists category_shoes_image_url text not null default '/images/site/category-shoes.jpg',
  add column if not exists category_accessories_image_url text not null default '/images/site/category-accessories.jpg';

update white_angels_apparels.site_settings
set
  category_women_image_url = coalesce(nullif(category_women_image_url, ''), '/images/site/category-women.jpg'),
  category_men_image_url = coalesce(nullif(category_men_image_url, ''), '/images/site/category-men.jpg'),
  category_shoes_image_url = coalesce(nullif(category_shoes_image_url, ''), '/images/site/category-shoes.jpg'),
  category_accessories_image_url = coalesce(nullif(category_accessories_image_url, ''), '/images/site/category-accessories.jpg')
where true;
