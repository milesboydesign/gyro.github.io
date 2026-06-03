-- Supabase schema and security policies for Neon Arcade
-- Run these statements in the Supabase SQL editor.

-- Create profile table for authenticated users.
create table if not exists public.user_profiles (
  id uuid primary key,
  username text,
  color text
);

-- Add user metadata and color to the existing chat table.
alter table if exists public.themessages
  add column if not exists user_id uuid,
  add column if not exists color text;

create extension if not exists "pgcrypto";

-- Create a Tetris score leaderboard table.
create table if not exists public.tetris_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  username text,
  score bigint,
  created_at timestamptz default now()
);

-- Create a Pac-Man score leaderboard table.
create table if not exists public.pacman_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  username text,
  score bigint,
  created_at timestamptz default now()
);

-- Create a Snake score leaderboard table.
create table if not exists public.snake_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  username text,
  score bigint,
  created_at timestamptz default now()
);

-- Enable Row Level Security for tables that accept user writes.
alter table if exists public.themessages enable row level security;
alter table if exists public.tetris_scores enable row level security;
alter table if exists public.pacman_scores enable row level security;
alter table if exists public.snake_scores enable row level security;

-- Public read access for the chat and leaderboard tables.
drop policy if exists "Allow select messages" on public.themessages;
create policy "Allow select messages" on public.themessages
  for select using (true);

drop policy if exists "Allow select tetris scores" on public.tetris_scores;
create policy "Allow select tetris scores" on public.tetris_scores
  for select using (true);

drop policy if exists "Allow select pacman scores" on public.pacman_scores;
create policy "Allow select pacman scores" on public.pacman_scores
  for select using (true);

-- Require authenticated users to insert their own rows.
drop policy if exists "Allow insert messages for owner" on public.themessages;
create policy "Allow insert messages for owner" on public.themessages
  for insert with check (auth.uid() = user_id);

drop policy if exists "Allow insert tetris scores for owner" on public.tetris_scores;
create policy "Allow insert tetris scores for owner" on public.tetris_scores
  for insert with check (auth.uid() = user_id);

drop policy if exists "Allow insert pacman scores for owner" on public.pacman_scores;
create policy "Allow insert pacman scores for owner" on public.pacman_scores
  for insert with check (auth.uid() = user_id);

drop policy if exists "Allow insert snake scores for owner" on public.snake_scores;
create policy "Allow insert snake scores for owner" on public.snake_scores
  for insert with check (auth.uid() = user_id);

-- Allow users to update/delete their own messages or scores if desired.
drop policy if exists "Allow delete messages for owner" on public.themessages;
create policy "Allow delete messages for owner" on public.themessages
  for delete using (auth.uid() = user_id);

drop policy if exists "Allow delete tetris scores for owner" on public.tetris_scores;
create policy "Allow delete tetris scores for owner" on public.tetris_scores
  for delete using (auth.uid() = user_id);

drop policy if exists "Allow delete pacman scores for owner" on public.pacman_scores;
create policy "Allow delete pacman scores for owner" on public.pacman_scores
  for delete using (auth.uid() = user_id);

drop policy if exists "Allow delete snake scores for owner" on public.snake_scores;
create policy "Allow delete snake scores for owner" on public.snake_scores
  for delete using (auth.uid() = user_id);
