-- Run once in Supabase SQL Editor before using Tutor Session Confirmation.
alter table public.teaching_schedules
  add column if not exists confirmation_status varchar(20) not null default 'pending',
  add column if not exists confirmation_reason text,
  add column if not exists confirmed_date timestamp;

create index if not exists idx_teaching_schedules_confirmation_status
  on public.teaching_schedules (confirmation_status);
