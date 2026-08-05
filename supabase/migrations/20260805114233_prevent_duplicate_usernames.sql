update public.profiles
set username = btrim(username)
where username <> btrim(username);

alter table public.profiles
  drop constraint profiles_username_key;

create unique index profiles_username_normalized_key
  on public.profiles (lower(btrim(username)));
