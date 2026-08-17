set search_path to white_angels_apparels, pg_catalog;

alter table white_angels_apparels.admins
  add column if not exists first_name text,
  add column if not exists surname text,
  add column if not exists email_verified_at timestamptz;

update white_angels_apparels.admins
set
  first_name = coalesce(first_name, split_part(full_name, ' ', 1)),
  surname = coalesce(surname, nullif(trim(replace(full_name, split_part(full_name, ' ', 1), '')), '')),
  email_verified_at = coalesce(email_verified_at, created_at)
where first_name is null or surname is null or email_verified_at is null;

create table if not exists white_angels_apparels.admin_email_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text not null,
  surname text not null,
  password_hash text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempt_count integer not null default 0,
  resend_count integer not null default 0,
  last_sent_at timestamptz not null default now(),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_admin_email_verifications_email_active
  on white_angels_apparels.admin_email_verifications (lower(email))
  where verified_at is null;

create table if not exists white_angels_apparels.site_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true,
  shop_name text not null default 'White Angels Apparels',
  logo_text text not null default 'White Angels Apparels',
  logo_url text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  whatsapp_channel_url text not null default '',
  facebook_url text not null default '',
  instagram_url text not null default '',
  tiktok_url text not null default '',
  hero_home_image_url text not null default '/images/hero-home.jpg',
  hero_home_side_image_url text not null default '/images/hero-product.jpg',
  hero_shop_image_url text not null default '/images/hero-shop.jpg',
  hero_about_image_url text not null default '/images/hero-about.jpg',
  hero_contact_image_url text not null default '/images/hero-contact.jpg',
  hero_cart_image_url text not null default '/images/hero-cart.jpg',
  hero_checkout_image_url text not null default '/images/hero-checkout.jpg',
  hero_track_order_image_url text not null default '/images/hero-track-order.jpg',
  hero_admin_login_image_url text not null default '/images/hero-admin-login.jpg',
  opening_hours text not null default '',
  ecocash_merchant_name text not null default '',
  ecocash_merchant_number text not null default '',
  collection_instructions text not null default 'Collection details will be confirmed after your order is approved.',
  default_delivery_fee numeric(12,2) not null default 5 check (default_delivery_fee >= 0),
  updated_by uuid references white_angels_apparels.admins(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_site_settings_singleton on white_angels_apparels.site_settings (singleton);

create table if not exists white_angels_apparels.stock_alert_subscribers (
  id uuid primary key default gen_random_uuid(),
  name text,
  whatsapp_number text not null unique,
  opted_in boolean not null default false,
  opted_in_at timestamptz,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'UNSUBSCRIBED', 'INACTIVE')),
  last_notification_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_stock_alert_subscribers_status on white_angels_apparels.stock_alert_subscribers (status);

create table if not exists white_angels_apparels.whatsapp_notification_logs (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references white_angels_apparels.stock_alert_subscribers(id) on delete cascade,
  message_type text not null default 'STOCK_ALERT',
  template_name text not null,
  status text not null check (status in ('PENDING', 'SENT', 'FAILED')),
  provider_message_id text,
  error_message text,
  sent_by uuid references white_angels_apparels.admins(id),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table white_angels_apparels.admin_email_verifications enable row level security;
alter table white_angels_apparels.site_settings enable row level security;
alter table white_angels_apparels.stock_alert_subscribers enable row level security;
alter table white_angels_apparels.whatsapp_notification_logs enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'white_angels_app') then
    grant select, insert, update, delete on white_angels_apparels.admin_email_verifications to white_angels_app;
    grant select, insert, update, delete on white_angels_apparels.site_settings to white_angels_app;
    grant select, insert, update, delete on white_angels_apparels.stock_alert_subscribers to white_angels_app;
    grant select, insert, update, delete on white_angels_apparels.whatsapp_notification_logs to white_angels_app;

    alter default privileges in schema white_angels_apparels grant select, insert, update, delete on tables to white_angels_app;

    create policy white_angels_app_admin_email_verifications_access on white_angels_apparels.admin_email_verifications for all to white_angels_app using (true) with check (true);
    create policy white_angels_app_site_settings_access on white_angels_apparels.site_settings for all to white_angels_app using (true) with check (true);
    create policy white_angels_app_stock_alert_subscribers_access on white_angels_apparels.stock_alert_subscribers for all to white_angels_app using (true) with check (true);
    create policy white_angels_app_whatsapp_notification_logs_access on white_angels_apparels.whatsapp_notification_logs for all to white_angels_app using (true) with check (true);
  end if;
exception
  when duplicate_object then null;
end $$;
