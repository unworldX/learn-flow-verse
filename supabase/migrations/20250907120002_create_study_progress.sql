
create table study_progress (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  course_name text not null,
  progress integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into study_progress (user_id, course_name, progress)
select id, 'React Fundamentals', 75 from auth.users limit 1;

insert into study_progress (user_id, course_name, progress)
select id, 'Advanced TypeScript', 40 from auth.users limit 1;

insert into study_progress (user_id, course_name, progress)
select id, 'Supabase Mastery', 90 from auth.users limit 1;
