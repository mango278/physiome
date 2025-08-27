-- Create profiles table for user management
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create injury_hypotheses table
create table if not exists public.injury_hypotheses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symptoms text not null,
  hypothesis text not null,
  confidence_score integer check (confidence_score >= 1 and confidence_score <= 10),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create workout_plans table
create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  injury_hypothesis_id uuid references public.injury_hypotheses(id) on delete set null,
  plan_name text not null,
  exercises jsonb not null, -- Store exercises as JSON array
  duration_weeks integer not null,
  difficulty_level text check (difficulty_level in ('beginner', 'intermediate', 'advanced')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create check_ins table
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_plan_id uuid references public.workout_plans(id) on delete set null,
  pain_level integer check (pain_level >= 1 and pain_level <= 10),
  mobility_score integer check (mobility_score >= 1 and mobility_score <= 10),
  notes text,
  completed_exercises jsonb, -- Track which exercises were completed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.injury_hypotheses enable row level security;
alter table public.workout_plans enable row level security;
alter table public.check_ins enable row level security;

-- Create RLS policies for profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- Create RLS policies for injury_hypotheses
create policy "injury_hypotheses_select_own"
  on public.injury_hypotheses for select
  using (auth.uid() = user_id);

create policy "injury_hypotheses_insert_own"
  on public.injury_hypotheses for insert
  with check (auth.uid() = user_id);

create policy "injury_hypotheses_update_own"
  on public.injury_hypotheses for update
  using (auth.uid() = user_id);

create policy "injury_hypotheses_delete_own"
  on public.injury_hypotheses for delete
  using (auth.uid() = user_id);

-- Create RLS policies for workout_plans
create policy "workout_plans_select_own"
  on public.workout_plans for select
  using (auth.uid() = user_id);

create policy "workout_plans_insert_own"
  on public.workout_plans for insert
  with check (auth.uid() = user_id);

create policy "workout_plans_update_own"
  on public.workout_plans for update
  using (auth.uid() = user_id);

create policy "workout_plans_delete_own"
  on public.workout_plans for delete
  using (auth.uid() = user_id);

-- Create RLS policies for check_ins
create policy "check_ins_select_own"
  on public.check_ins for select
  using (auth.uid() = user_id);

create policy "check_ins_insert_own"
  on public.check_ins for insert
  with check (auth.uid() = user_id);

create policy "check_ins_update_own"
  on public.check_ins for update
  using (auth.uid() = user_id);

create policy "check_ins_delete_own"
  on public.check_ins for delete
  using (auth.uid() = user_id);
