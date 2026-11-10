-- Finds sessions that were submitted more than once: same circle (or UC for Ijtima Arkan), same type, same date.
-- STEP 1 only reads. Review the list in the Supabase SQL Editor before doing anything else.

-- STEP 1: preview. "keep" is the copy with the most attendance marked; the others would be deleted.
with ranked as (
  select s.id, s.session_date, s.category, coalesce(c.name, u.name) as place,
         (select count(*) from attendance a where a.session_id = s.id) as marked,
         row_number() over (
           partition by s.category, coalesce(s.circle_id, s.uc_id), s.session_date
           order by (select count(*) from attendance a where a.session_id = s.id) desc, s.created_at
         ) as copy_no,
         count(*) over (partition by s.category, coalesce(s.circle_id, s.uc_id), s.session_date) as copies
  from sessions s
  left join quran_circles c on c.id = s.circle_id
  left join union_councils u on u.id = s.uc_id
)
select session_date, category, place, marked, case when copy_no = 1 then 'keep' else 'delete' end as action, id
from ranked where copies > 1
order by session_date desc, place, copy_no;

-- STEP 2: delete the extra copies. Their attendance rows are removed with them.
-- Only run this after checking STEP 1, and ideally after downloading a backup.
-- Remove the two dashes at the start of each line below, then run.
-- delete from sessions where id in (
--   select id from (
--     select s.id, row_number() over (
--       partition by s.category, coalesce(s.circle_id, s.uc_id), s.session_date
--       order by (select count(*) from attendance a where a.session_id = s.id) desc, s.created_at
--     ) as copy_no
--     from sessions s
--   ) r where copy_no > 1
-- );

-- STEP 3: do NOT run this for now.
-- A rule allowing only one session per circle, type and day would also block a murabbi from
-- submitting a report for a class the admin already put on the Schedule (same circle, type and date),
-- and the app's "Save another anyway" option would fail. The app already warns before duplicates.
-- create unique index if not exists sessions_one_per_day on sessions (category, coalesce(circle_id, uc_id), session_date);
