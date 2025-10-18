
create table quick_stats (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  courses integer not null default 0,
  quizzes integer not null default 0,
  uploads integer not null default 0,
  points integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into quick_stats (user_id, courses, quizzes, uploads, points)
select id, 12, 45, 8, 1200 from auth.users limit 1;
