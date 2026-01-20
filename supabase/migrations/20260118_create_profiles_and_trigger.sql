-- BuyzoneX Supabase migration
-- Creates a profiles table (if missing) and a trigger to auto-create a profile row on signup.
--
-- Apply in Supabase Dashboard -> SQL Editor.

-- 1) profiles table must exist with id = auth.users.id
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text default 'customer',
  created_at timestamp with time zone default now()
);

-- 2) auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
