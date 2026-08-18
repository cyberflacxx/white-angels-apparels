create sequence if not exists white_angels_apparels.pos_sale_number_seq;

create table if not exists white_angels_apparels.pos_sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text not null unique,
  client_reference uuid not null unique,
  sold_at timestamptz not null default now(),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  total_units integer not null check (total_units > 0),
  created_by uuid not null references white_angels_apparels.admins(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_pos_sales_sold_at on white_angels_apparels.pos_sales (sold_at desc);
create index if not exists idx_pos_sales_created_by on white_angels_apparels.pos_sales (created_by);

create table if not exists white_angels_apparels.pos_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references white_angels_apparels.pos_sales(id) on delete cascade,
  product_id uuid not null references white_angels_apparels.products(id),
  product_name text not null,
  sku text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);
create index if not exists idx_pos_sale_items_sale on white_angels_apparels.pos_sale_items (sale_id);
create index if not exists idx_pos_sale_items_product on white_angels_apparels.pos_sale_items (product_id);

alter table white_angels_apparels.pos_sales enable row level security;
alter table white_angels_apparels.pos_sale_items enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'white_angels_app') then
    grant select, insert, update, delete on white_angels_apparels.pos_sales to white_angels_app;
    grant select, insert, update, delete on white_angels_apparels.pos_sale_items to white_angels_app;
    grant usage, select, update on sequence white_angels_apparels.pos_sale_number_seq to white_angels_app;

    if not exists (
      select 1
      from pg_policies
      where schemaname = 'white_angels_apparels'
        and tablename = 'pos_sales'
        and policyname = 'white_angels_app_pos_sales_access'
    ) then
      create policy white_angels_app_pos_sales_access
        on white_angels_apparels.pos_sales
        for all
        to white_angels_app
        using (true)
        with check (true);
    end if;

    if not exists (
      select 1
      from pg_policies
      where schemaname = 'white_angels_apparels'
        and tablename = 'pos_sale_items'
        and policyname = 'white_angels_app_pos_sale_items_access'
    ) then
      create policy white_angels_app_pos_sale_items_access
        on white_angels_apparels.pos_sale_items
        for all
        to white_angels_app
        using (true)
        with check (true);
    end if;
  end if;
end $$;
