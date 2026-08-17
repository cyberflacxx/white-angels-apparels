create schema if not exists white_angels_apparels;
set search_path to white_angels_apparels, pg_catalog;

create sequence if not exists white_angels_apparels.order_number_seq;

do $$ begin create type white_angels_apparels.admin_role as enum ('ADMIN'); exception when duplicate_object then null; end $$;
do $$ begin create type white_angels_apparels.record_status as enum ('ACTIVE','INACTIVE','ARCHIVED'); exception when duplicate_object then null; end $$;
do $$ begin create type white_angels_apparels.payment_method as enum ('ECOCASH','CASH'); exception when duplicate_object then null; end $$;
do $$ begin create type white_angels_apparels.payment_status as enum ('PENDING','PENDING_VERIFICATION','PAID','REJECTED','REFUNDED'); exception when duplicate_object then null; end $$;
do $$ begin create type white_angels_apparels.fulfilment_method as enum ('HOME_DELIVERY','SHOP_COLLECTION'); exception when duplicate_object then null; end $$;
do $$ begin create type white_angels_apparels.order_status as enum ('PENDING','AWAITING_PAYMENT','PAYMENT_VERIFICATION','PAID','CONFIRMED','PREPARING','READY_FOR_COLLECTION','OUT_FOR_DELIVERY','DELIVERED','COLLECTED','CANCELLED'); exception when duplicate_object then null; end $$;
do $$ begin create type white_angels_apparels.inventory_movement_type as enum ('STOCK_IN','SALE','ADJUSTMENT','RETURN','DAMAGED'); exception when duplicate_object then null; end $$;

create table if not exists white_angels_apparels.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  status white_angels_apparels.record_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists white_angels_apparels.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text not null unique,
  category_id uuid not null references white_angels_apparels.categories(id),
  short_description text,
  description text,
  price numeric(12,2) not null check (price >= 0),
  previous_price numeric(12,2) check (previous_price is null or previous_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  status white_angels_apparels.record_status not null default 'ACTIVE',
  featured boolean not null default false,
  new_arrival boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_category on white_angels_apparels.products(category_id);
create index if not exists idx_products_status on white_angels_apparels.products(status);

create table if not exists white_angels_apparels.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references white_angels_apparels.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_product_images_product on white_angels_apparels.product_images(product_id);

create table if not exists white_angels_apparels.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  alternate_phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists white_angels_apparels.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references white_angels_apparels.customers(id),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total numeric(12,2) not null check (total >= 0),
  payment_method white_angels_apparels.payment_method not null,
  payment_status white_angels_apparels.payment_status not null default 'PENDING',
  fulfilment_method white_angels_apparels.fulfilment_method not null,
  order_status white_angels_apparels.order_status not null default 'PENDING',
  stock_restored_at timestamptz,
  customer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_customer on white_angels_apparels.orders(customer_id);
create index if not exists idx_orders_status on white_angels_apparels.orders(order_status);
create index if not exists idx_orders_created_at on white_angels_apparels.orders(created_at);

create table if not exists white_angels_apparels.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references white_angels_apparels.orders(id) on delete cascade,
  product_id uuid references white_angels_apparels.products(id),
  product_name text not null,
  sku text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists white_angels_apparels.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references white_angels_apparels.orders(id) on delete cascade,
  method white_angels_apparels.payment_method not null,
  amount numeric(12,2) not null check (amount >= 0),
  ecocash_phone text,
  ecocash_reference text,
  payment_proof_url text,
  status white_angels_apparels.payment_status not null default 'PENDING',
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists white_angels_apparels.delivery_addresses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references white_angels_apparels.orders(id) on delete cascade,
  province text,
  city text,
  suburb text,
  street text,
  house_number text,
  landmark text,
  delivery_instructions text
);

create table if not exists white_angels_apparels.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references white_angels_apparels.orders(id) on delete cascade,
  previous_status white_angels_apparels.order_status,
  new_status white_angels_apparels.order_status not null,
  changed_by uuid,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists white_angels_apparels.admins (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  role white_angels_apparels.admin_role not null default 'ADMIN',
  status white_angels_apparels.record_status not null default 'ACTIVE',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists white_angels_apparels.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references white_angels_apparels.products(id),
  movement_type white_angels_apparels.inventory_movement_type not null,
  quantity integer not null,
  stock_before integer not null,
  stock_after integer not null check (stock_after >= 0),
  reference text,
  notes text,
  created_by uuid references white_angels_apparels.admins(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_inventory_product on white_angels_apparels.inventory_movements(product_id);

alter table white_angels_apparels.categories enable row level security;
alter table white_angels_apparels.products enable row level security;
alter table white_angels_apparels.product_images enable row level security;
alter table white_angels_apparels.customers enable row level security;
alter table white_angels_apparels.orders enable row level security;
alter table white_angels_apparels.order_items enable row level security;
alter table white_angels_apparels.payments enable row level security;
alter table white_angels_apparels.delivery_addresses enable row level security;
alter table white_angels_apparels.order_status_history enable row level security;
alter table white_angels_apparels.admins enable row level security;
alter table white_angels_apparels.inventory_movements enable row level security;
alter table white_angels_apparels.schema_migrations enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'white_angels_app') then
    grant usage on schema white_angels_apparels to white_angels_app;
    grant select, insert, update, delete on all tables in schema white_angels_apparels to white_angels_app;
    grant usage, select, update on all sequences in schema white_angels_apparels to white_angels_app;
    alter default privileges in schema white_angels_apparels grant select, insert, update, delete on tables to white_angels_app;
    alter default privileges in schema white_angels_apparels grant usage, select, update on sequences to white_angels_app;

    create policy white_angels_app_categories_access on white_angels_apparels.categories for all to white_angels_app using (true) with check (true);
    create policy white_angels_app_products_access on white_angels_apparels.products for all to white_angels_app using (true) with check (true);
    create policy white_angels_app_product_images_access on white_angels_apparels.product_images for all to white_angels_app using (true) with check (true);
    create policy white_angels_app_customers_access on white_angels_apparels.customers for all to white_angels_app using (true) with check (true);
    create policy white_angels_app_orders_access on white_angels_apparels.orders for all to white_angels_app using (true) with check (true);
    create policy white_angels_app_order_items_access on white_angels_apparels.order_items for all to white_angels_app using (true) with check (true);
    create policy white_angels_app_payments_access on white_angels_apparels.payments for all to white_angels_app using (true) with check (true);
    create policy white_angels_app_delivery_addresses_access on white_angels_apparels.delivery_addresses for all to white_angels_app using (true) with check (true);
    create policy white_angels_app_order_status_history_access on white_angels_apparels.order_status_history for all to white_angels_app using (true) with check (true);
    create policy white_angels_app_admins_access on white_angels_apparels.admins for all to white_angels_app using (true) with check (true);
    create policy white_angels_app_inventory_movements_access on white_angels_apparels.inventory_movements for all to white_angels_app using (true) with check (true);
    create policy white_angels_app_schema_migrations_access on white_angels_apparels.schema_migrations for all to white_angels_app using (true) with check (true);
  end if;
end $$;
