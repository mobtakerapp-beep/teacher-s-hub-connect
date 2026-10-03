create type public.app_role as enum ('admin', 'teacher');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Users read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Admins read all roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins read all profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text not null default '',
  subject text,
  category text,
  grade text,
  file_path text,
  file_ext text,
  file_size bigint,
  video_url text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.files to authenticated;
grant all on public.files to service_role;
alter table public.files enable row level security;
create policy "Owners read own files" on public.files for select to authenticated using (auth.uid() = user_id);
create policy "Owners insert own files" on public.files for insert to authenticated with check (auth.uid() = user_id);
create policy "Owners update own files" on public.files for update to authenticated using (auth.uid() = user_id);
create policy "Owners delete own files" on public.files for delete to authenticated using (auth.uid() = user_id);
create policy "Admins read all files" on public.files for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.thanks (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references auth.users(id) on delete cascade not null,
  admin_id uuid references auth.users(id) on delete cascade not null,
  message text not null,
  created_at timestamptz not null default now()
);
grant select, insert on public.thanks to authenticated;
grant all on public.thanks to service_role;
alter table public.thanks enable row level security;
create policy "Teachers read own thanks" on public.thanks for select to authenticated using (auth.uid() = teacher_id);
create policy "Admins insert thanks" on public.thanks for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins read all thanks" on public.thanks for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "Owners read own storage" on storage.objects for select to authenticated using (bucket_id = 'teacher-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owners upload own storage" on storage.objects for insert to authenticated with check (bucket_id = 'teacher-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owners delete own storage" on storage.objects for delete to authenticated using (bucket_id = 'teacher-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Admins read all storage" on storage.objects for select to authenticated using (bucket_id = 'teacher-files' and public.has_role(auth.uid(), 'admin'));