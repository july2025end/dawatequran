-- Deletes the extra copies of duplicate sessions (same circle or council, same type, same date)
-- and their attendance rows. In each group it keeps the copy with the most attendance marked.
-- Expected result: "38 rows affected" (if the duplicates are still there). Cannot be undone.
delete from sessions where id in (
  select id from (
    select s.id, row_number() over (
      partition by s.category, coalesce(s.circle_id, s.uc_id), s.session_date
      order by (select count(*) from attendance a where a.session_id = s.id) desc, s.created_at
    ) as copy_no
    from sessions s
  ) r where copy_no > 1
);
