create table public.feedback (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  message text not null,
  email text,
  page_url text,
  user_agent text,
  github_issue_number integer,
  github_issue_url text,
  status text default 'submitted' -- 'submitted' | 'synced' | 'failed'
);

-- RLS so users can only insert, not read others' feedback
alter table public.feedback enable row level security;

create policy "Anyone can insert feedback"
  on public.feedback for insert
  with check (true);
