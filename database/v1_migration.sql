-- Dawat-e-Quran v1 database update. Safe to run more than once; it only adds rules and indexes.
-- Run in Supabase: SQL Editor -> paste -> Run.

-- 1. Attendance can only be present, absent or leave (all 4,186 existing rows already are).
alter table attendance alter column status set default 'absent';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'attendance_status_valid') then
    alter table attendance add constraint attendance_status_valid check (status in ('present', 'absent', 'leave'));
  end if;
end $$;

-- 2. Indexes for the queries the app runs on every page load.
create index if not exists attendance_participant_idx on attendance (participant_id);
create index if not exists sessions_circle_date_idx   on sessions (circle_id, session_date);
create index if not exists sessions_uc_date_idx       on sessions (uc_id, session_date);
create index if not exists participants_circle_idx    on participants (circle_id) where is_active;

-- 3. Check: list the access rules on each table.
select tablename, policyname, cmd, roles from pg_policies where schemaname = 'public' order by tablename, cmd;
