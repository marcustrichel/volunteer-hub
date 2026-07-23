-- Volunteer Hub schema.
-- Paste this whole file into the Supabase SQL Editor and run it once per
-- project (dev and, later, production — same script both times).

create extension if not exists pgcrypto;

-- Single-row table holding app-wide settings (currently just the group name).
create table app_settings (
  id int primary key default 1 check (id = 1),
  group_name text not null default 'My Volunteers',
  updated_at timestamptz not null default now()
);
insert into app_settings (id, group_name) values (1, 'My Volunteers');

create table volunteers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  email text,
  phone text,
  birthday date,
  anniversary date,
  food text,
  color text,
  hobby text,
  notes text,
  custom_date_1 date,
  custom_date_1_label text,
  created_at timestamptz not null default now()
);

create table logs (
  id uuid primary key default gen_random_uuid(),
  vid uuid not null references volunteers(id) on delete cascade,
  hrs numeric not null check (hrs > 0),
  date date not null,
  note text,
  created_at timestamptz not null default now()
);
create index logs_vid_idx on logs(vid);

create table swag (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '🎁',
  desc text,
  hrs numeric not null check (hrs > 0),
  created_at timestamptz not null default now()
);

insert into swag (name, emoji, desc, hrs) values
  ('Enamel pin', '📌', 'Exclusive org logo pin', 10),
  ('Tote bag', '👜', 'Heavy-duty canvas tote', 25),
  ('Hoodie', '🧥', 'Embroidered crew hoodie', 50),
  ('Insulated tumbler', '☕', 'Custom 20oz tumbler', 75),
  ('Jacket', '🧤', 'Premium fleece zip-up', 100),
  ('Experience day', '🌟', 'VIP behind-the-scenes invite', 150);

-- RLS: any signed-in staff member (Auth → Users, admin-invited only) has
-- full read/write access to all data. Signed-out requests get nothing back.
alter table volunteers enable row level security;
alter table logs enable row level security;
alter table swag enable row level security;
alter table app_settings enable row level security;

create policy "auth full access" on volunteers
  for all to authenticated using (true) with check (true);
create policy "auth full access" on logs
  for all to authenticated using (true) with check (true);
create policy "auth full access" on swag
  for all to authenticated using (true) with check (true);
create policy "auth full access" on app_settings
  for all to authenticated using (true) with check (true);
