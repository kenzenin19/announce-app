-- DAY 1: profiles + roles
-- Paste into Supabase > SQL Editor > New query > Run

create type public.user_role as enum ('admin', 'mod', 'member');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role public.user_role not null default 'member',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Auto-create a profile whenever someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: current user's role (used by RLS on later days)
create or replace function public.current_role_name()
returns public.user_role
language sql stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Policies
create policy "signed-in users can read profiles"
  on public.profiles for select to authenticated
  using (true);

-- Users can edit their own profile, but cannot change their own role
create policy "users update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_role_name());

-- Admins can update anyone (to promote mods)
create policy "admins update any profile"
  on public.profiles for update to authenticated
  using (public.current_role_name() = 'admin')
  with check (public.current_role_name() = 'admin');

-- AFTER you sign up your own account in the app, make yourself admin:
-- update public.profiles
-- set role = 'admin'
-- where id = (select id from auth.users where email = 'YOUR_EMAIL_HERE');
