-- Run this in Supabase SQL Editor if frontend data queries fail after login.
-- Keeps `users` table server-only; allows anon access to app tables used by the UI.

create or replace view public.user_profiles as
  select user_id, full_name, email, role, status, created_date
  from public.users;

grant select on public.user_profiles to anon, authenticated;

alter table users enable row level security;
-- No anon policy on `users` — login uses backend service role.

alter table learning_requests enable row level security;
alter table parents enable row level security;
alter table managers enable row level security;
alter table tutors enable row level security;
alter table assignments enable row level security;
alter table classes enable row level security;
alter table sessions enable row level security;
alter table notifications enable row level security;

drop policy if exists anon_all_learning_requests on learning_requests;
create policy anon_all_learning_requests on learning_requests
  for all to anon using (true) with check (true);

drop policy if exists anon_all_parents on parents;
create policy anon_all_parents on parents
  for all to anon using (true) with check (true);

drop policy if exists anon_all_managers on managers;
create policy anon_all_managers on managers
  for all to anon using (true) with check (true);

drop policy if exists anon_all_tutors on tutors;
create policy anon_all_tutors on tutors
  for all to anon using (true) with check (true);

drop policy if exists anon_all_assignments on assignments;
create policy anon_all_assignments on assignments
  for all to anon using (true) with check (true);

drop policy if exists anon_all_classes on classes;
create policy anon_all_classes on classes
  for all to anon using (true) with check (true);

drop policy if exists anon_all_sessions on sessions;
create policy anon_all_sessions on sessions
  for all to anon using (true) with check (true);

-- Notifications are accessed through the authenticated backend API only.
drop policy if exists anon_all_notifications on notifications;

-- Do NOT expose `users.password` to anon. Login goes through the backend API.
