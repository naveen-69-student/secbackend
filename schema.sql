create table if not exists categories (
  id serial primary key,
  name text unique,
  image text
);

create table if not exists products (
  id serial primary key,
  name text,
  description text,
  price integer,
  image text,
  category text
);

create table if not exists orders (
  id serial primary key,
  items text,
  details text,
  created_at timestamp default now()
);

create table if not exists status (
  key text primary key,
  value text
);
