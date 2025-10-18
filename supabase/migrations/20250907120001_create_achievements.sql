
create table achievements (
  id bigserial primary key,
  name text not null,
  description text,
  icon text,
  created_at timestamptz default now()
);

create table user_achievements (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  achievement_id bigint references achievements(id) on delete cascade,
  earned_at timestamptz default now(),
  unique(user_id, achievement_id)
);

insert into achievements (name, icon) values
('First Steps', 'Award'),
('Quick Learner', 'Target'),
('Course Pro', 'Star'),
('Quiz Master', 'Award'),
('Perfect Score', 'Target'),
('1-Year Streak', 'Star');
