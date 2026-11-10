-- Dawat-e-Quran v2 database update. Safe to run more than once.
-- Run in Supabase: SQL Editor -> paste -> Run.

-- 1. Attendance summaries, so the dashboard reads a few hundred rows instead of every record.
create or replace view session_attendance_counts with (security_invoker = true) as
select a.session_id, p.type,
       count(*) filter (where a.status = 'present') as present,
       count(*) filter (where a.status = 'absent')  as absent,
       count(*) filter (where a.status = 'leave')   as leave
from attendance a
join participants p on p.id = a.participant_id
group by a.session_id, p.type;

create or replace view member_attendance_summary with (security_invoker = true) as
with marked as (
  select a.participant_id, a.status, s.session_date,
         row_number() over (partition by a.participant_id order by s.session_date desc, s.created_at desc) as rn
  from attendance a
  join sessions s on s.id = a.session_id
  where a.status <> 'leave' and s.session_date <= (now() at time zone 'Asia/Karachi')::date
)
select participant_id,
       count(*) filter (where status = 'present') as present,
       count(*) as marked,
       max(session_date) filter (where status = 'present') as last_present,
       max(session_date) as last_marked,
       coalesce(array_agg(status order by rn) filter (where rn <= 3), '{}') as recent
from marked
group by participant_id;

grant select on session_attendance_counts, member_attendance_summary to anon, authenticated;

-- 2. Circle representatives, editable from Admin -> Representatives (was hard-coded in the page).
create table if not exists representatives (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'Circle Head (Murabbi)',
  circle_name text,
  uc text not null,
  sector text,
  phone text,
  whatsapp text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table representatives enable row level security;
-- Same access as the other tables: the portals have no sign-in.
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'representatives' and policyname = 'Public read representatives') then
    create policy "Public read representatives" on representatives for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'representatives' and policyname = 'Public manage representatives') then
    create policy "Public manage representatives" on representatives for all to anon, authenticated using (true) with check (true);
  end if;
end $$;

-- Copy the 46 contacts that were written into the page (only if the table is empty).
insert into representatives (name, role, circle_name, uc, sector, phone, whatsapp, sort_order)
select * from (values
  ('Muhammad Rashid', 'Nazim UC', 'UC Leadership', 'UC-81', 'G-9/3 Karachi Company', '+92 331 6378566', '923316378566', 1),
  ('Hafiz Mubarak Ahmed', 'Circle Head (Murabbi)', 'Circle 2', 'UC-81', 'G-9/3 Karachi Company', '+92 302 5211231', '923025211231', 2),
  ('Dr. Zaheer-ud-Din Bahram', 'Circle Head (Murabbi)', 'Circle 3', 'UC-81', 'G-9/3 Karachi Company', '+92 314 5262303', '923145262303', 3),
  ('Professor Abdul Sami', 'Circle Head (Murabbi)', 'Circle 1', 'UC-81', 'G-9/3 Karachi Company', '+92 322 5006262', '923225006262', 4),
  ('Muhammad Akhtar Abbas', 'Nazim Bait-ul-Maal', 'Circle 4', 'UC-81', 'G-9/3 Karachi Company', '+92 301 7746424', '923017746424', 5),
  ('Abdul Subhan', 'Nazim UC', 'UC Leadership', 'UC-82', 'G-9/2', '+92 334 5328863', '923345328863', 6),
  ('Mubarak Ahmed', 'Circle Head (Murabbi)', 'Circle 1', 'UC-82', 'G-9/2', '+92 302 5211231', '923025211231', 7),
  ('Abdul Samad', 'Circle Head (Murabbi)', 'Circle 2', 'UC-82', 'G-9/2', '+92 310 9064070', '923109064070', 8),
  ('Azhar Baloch', 'Nazim UC', 'UC Leadership', 'UC-83', 'G-9/4', '+92 333 5152913', '923335152913', 9),
  ('Dr. Mubeen Siddiqui', 'Circle Head (Murabbi)', 'Circle 1', 'UC-83', 'G-9/4', '+92 333 5152913', '923335152913', 10),
  ('Safeer Ahmed Mughal', 'Nazim UC', 'UC Leadership', 'UC-84', 'G-10/2-3', '+92 300 8270709', '923008270709', 11),
  ('Maaz Siddiqui', 'Circle Head (Murabbi)', 'Circle 1', 'UC-84', 'G-10/2-3', '+92 317 5853656', '923175853656', 12),
  ('Ghulam Sarwar Shakir', 'Circle Head (Murabbi)', 'Circle 3', 'UC-84', 'G-10/2-3', '+92 300 8563212', '923008563212', 13),
  ('Ghulam Mustafa', 'Circle Head (Murabbi)', 'Circle 4', 'UC-84', 'G-10/2-3', '+92 344 5844503', '923445844503', 14),
  ('Nadeem Ahmed Subhani', 'Nazim UC', 'UC Leadership', 'UC-85', 'G-10/1-4', '+92 300 8270709', '923008270709', 15),
  ('Dr. Tahir Farooq', 'Circle Head (Murabbi)', 'Circle 1', 'UC-85', 'G-10/1-4', '+92 317 5853656', '923175853656', 16),
  ('Abdullah Sarfraz', 'Circle Head (Murabbi)', 'Circle 2', 'UC-85', 'G-10/1-4', '+92 335 5527165', '923355527165', 17),
  ('Abdul Quddus Qureshi', 'Circle Head (Murabbi)', 'Circle 3', 'UC-85', 'G-10/1-4', '+92 332 4833364', '923324833364', 18),
  ('Muhammad Zia-ur-Rahman', 'Nazim UC', 'UC Leadership', 'UC-86', 'G-11/1-2', '+92 331 5418491', '923315418491', 19),
  ('Hafiz Bakht Ali', 'Circle Head (Murabbi)', 'Circle 2', 'UC-86', 'G-11/1-2', '+92 300 5395004', '923005395004', 20),
  ('Farid Brohi', 'Circle Head (Murabbi)', 'Circle 4', 'UC-86', 'G-11/1-2', '+92 333 2386693', '923332386693', 21),
  ('Mushtaq Ahmed', 'Circle Head (Murabbi)', 'Circle 5', 'UC-86', 'G-11/1-2', '+92 300 8555441', '923008555441', 22),
  ('Sagheer Ahmed Bhatti', 'Circle Head (Murabbi)', 'Circle 3', 'UC-86', 'G-11/1-2', '+92 335 55564448', '923355564448', 23),
  ('Shabbir Hussain', 'Nazim UC', 'UC Leadership', 'UC-87', 'G-11/3-4', '+92 312 5597792', '923125597792', 24),
  ('Muhammad Tayyab Siddiqui', 'Circle Head (Murabbi)', 'Circle 2', 'UC-87', 'G-11/3-4', '+92 300 8593979', '923008593979', 25),
  ('Syed Mahmood Ahmed', 'Nazim Circle', 'Circle 1', 'UC-87', 'G-11/3-4', '+92 321 9595369', '923219595369', 26),
  ('Zaheer Ahmed', 'Representative', 'Circle Coordination', 'UC-87', 'G-11/3-4', '+92 336 5573767', '923365573767', 27),
  ('Najeeb Abbasi', 'Nazim UC', 'UC Leadership', 'UC-88', 'I-8/2-3, H-8', '+92 300 5009351', '923005009351', 28),
  ('Muhammad Zubair Siddiqui', 'Circle Head (Murabbi)', 'Circle 1', 'UC-88', 'I-8/2-3', '+92 302 9200212', '923029200212', 29),
  ('Shams-ul-Islam Abbasi', 'Circle Head (Murabbi)', 'Circle 2', 'UC-88', 'I-8/2-3', '+92 345 5236663', '923455236663', 30),
  ('Noor Zaman', 'Nazim UC', 'UC Leadership', 'UC-89', 'I-8/1-4', '+92 333 5685268', '923335685268', 31),
  ('Muhammad Qayyum Johar', 'Circle Head (Murabbi)', 'Circle 2', 'UC-89', 'I-8/1-4', '+92 334 5450677', '923345450677', 32),
  ('Haroon Rashid', 'Circle Head (Murabbi)', 'Circle 1', 'UC-89', 'I-8/1-4', '+92 342 1114206', '923421114206', 33),
  ('Ehsan-ul-Haq', 'Nazim UC', 'UC Leadership', 'UC-90-A', 'I-9/4', '+92 302 5761075', '923025761075', 34),
  ('Ahsan Qaseem Abbasi', 'Circle Representative', 'Circle 1', 'UC-90-A', 'I-9/4', '+92 300 9700050', '923009700050', 35),
  ('Ashfaq Ahmed', 'Nazim UC', 'UC Leadership', 'UC-90-B', 'I-9/1-2-3, H-9', '+92 321 6351590', '923216351590', 36),
  ('Col. Khalid Mahmood Abbasi', 'Nazim Circle', 'Circle 1', 'UC-90-B', 'I-9/1-2-3, H-9', '+92 301 8546915', '923018546915', 37),
  ('Anas Zubair', 'Nazim UC', 'UC Leadership', 'UC-91', 'I-10/4', '+92 331 5044580', '923315044580', 38),
  ('Inayatullah', 'Nazim Circle', 'Circle 1', 'UC-91', 'I-10/4', '+92 310 2346205', '923102346205', 39),
  ('Tariq Malik', 'Circle Representative', 'Circle 2', 'UC-91', 'I-10/4', '+92 333 5389460', '923335389460', 40),
  ('Hanifullah', 'Nazim UC', 'UC Leadership', 'UC-92', 'I-10/2', '+92 345 9532660', '923459532660', 41),
  ('Masood Ali Asdar', 'Nazim Maliyat & Rep', 'Circle 1', 'UC-92', 'I-10/2', '+92 333 9835233', '923339835233', 42),
  ('Sagheer Ahmed', 'Circle Representative', 'Circle 2', 'UC-92', 'I-10/2', '+92 333 5068105', '923335068105', 43),
  ('Anwar Niazi', 'Circle Representative', 'Circle 1', 'UC-93', 'I-10/1', '+92 333 5297198', '923335297198', 44),
  ('Ghufranullah Bhatti', 'Circle Representative', 'Circle 2', 'UC-93', 'I-10/1', '+92 321 5204394', '923215204394', 45),
  ('Malik Mazhar-ul-Hassan', 'Circle Representative', 'Circle 3', 'UC-93', 'I-10/1', '+92 300 5050386', '923005050386', 46)
) as v(name, role, circle_name, uc, sector, phone, whatsapp, sort_order)
where not exists (select 1 from representatives);

-- 3. Check
select (select count(*) from representatives) as representatives,
       (select count(*) from session_attendance_counts) as session_count_rows,
       (select count(*) from member_attendance_summary) as member_summary_rows;
