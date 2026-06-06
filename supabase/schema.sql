-- =====================================================
-- 白云城建物业展示系统 - Supabase 数据库结构
-- 在 Supabase 控制台的 SQL Editor 中执行这段脚本
-- =====================================================

-- 1. 物业表
create table if not exists public.properties (
  id            uuid primary key default gen_random_uuid(),
  code          text not null,                        -- 编号，如 A-101
  name          text,                                  -- 名称（可选）
  type          text not null check (type in ('shop', 'parking')),  -- 商铺 / 车位
  district      text not null check (district in ('白云区', '荔湾区', '海珠区', '越秀区')),
  address       text not null,                         -- 详细地址
  area          numeric,                               -- 面积（平方米）
  status        text not null default 'vacant' check (status in ('vacant', 'rented', 'reserved')),
  price_min     numeric,                               -- 租金下限（元/月）
  price_max     numeric,                               -- 租金上限（元/月）
  latitude      numeric,                               -- 纬度（用于地图）
  longitude     numeric,                               -- 经度（用于地图）
  description   text,                                  -- 备注
  contact       text,                                  -- 联系电话或微信
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- 同一编号在同一区下唯一
  unique (district, code)
);

-- 索引
create index if not exists idx_properties_type     on public.properties (type);
create index if not exists idx_properties_district on public.properties (district);
create index if not exists idx_properties_status   on public.properties (status);

-- updated_at 自动更新
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_properties_updated_at on public.properties;
create trigger trg_properties_updated_at
  before update on public.properties
  for each row execute function public.touch_updated_at();

-- =====================================================
-- 2. 行级安全策略（Row Level Security）
-- 公开访问只读，仅认证用户可写
-- =====================================================

alter table public.properties enable row level security;

-- 任何人（包括未登录访客）都可以读取
drop policy if exists "Public read properties" on public.properties;
create policy "Public read properties"
  on public.properties
  for select
  using (true);

-- 只有登录用户（auth.role() = 'authenticated'）可以写
drop policy if exists "Auth write properties" on public.properties;
create policy "Auth write properties"
  on public.properties
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- =====================================================
-- 3. 管理员账号
-- 首次使用：在 Supabase 控制台 Auth → Users → Add user 手动创建
-- 邮箱 + 密码登录后，访问 /admin 即可增删改
-- =====================================================
