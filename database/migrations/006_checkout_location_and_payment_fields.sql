set search_path to white_angels_apparels, pg_catalog;

alter table if exists white_angels_apparels.delivery_addresses
  add column if not exists delivery_latitude double precision,
  add column if not exists delivery_longitude double precision;

alter table if exists white_angels_apparels.payments
  add column if not exists ecocash_payer_name text;
