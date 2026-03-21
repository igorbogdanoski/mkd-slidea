-- ============================================================
-- MKD Slidea — Supabase Database Setup
-- Извршете го целиот овој скрипт во Supabase SQL Editor
-- ============================================================

-- 1. Овозможување на UUID екстензија (ако веќе не е вклучена)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ТАБЕЛИ
-- ============================================================

-- 2. Табела за Настани (Events)
CREATE TABLE IF NOT EXISTS events (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code       TEXT UNIQUE NOT NULL,
  title      TEXT,
  active_poll_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Табела за Активности (Polls & Quizzes)
CREATE TABLE IF NOT EXISTS polls (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id   UUID REFERENCES events(id) ON DELETE CASCADE,
  question   TEXT NOT NULL,
  type       TEXT DEFAULT 'poll',
  active     BOOLEAN DEFAULT true,
  is_quiz    BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Табела за Опции (Options)
CREATE TABLE IF NOT EXISTS options (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id    UUID REFERENCES polls(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  votes      INTEGER DEFAULT 0,
  is_correct BOOLEAN DEFAULT false
);

-- 5. Табела за Q&A Прашања (Questions)
CREATE TABLE IF NOT EXISTS questions (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id    UUID REFERENCES events(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  author      TEXT DEFAULT 'Гостин',
  votes       INTEGER DEFAULT 0,
  is_answered BOOLEAN DEFAULT false,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Табела за Реакции (Reactions)
CREATE TABLE IF NOT EXISTS reactions (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id   UUID REFERENCES events(id) ON DELETE CASCADE,
  emoji      TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Табела за Резултати (Leaderboard)
CREATE TABLE IF NOT EXISTS leaderboard (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id     UUID REFERENCES events(id) ON DELETE CASCADE,
  username     TEXT NOT NULL,
  points       INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, username)
);

-- 8. Табела за Кориснички профили (Profiles)
-- Врзана за Supabase Auth (auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      TEXT,
  name       TEXT,
  role       TEXT DEFAULT 'user',   -- 'user' | 'admin'
  plan       TEXT DEFAULT 'basic',  -- 'basic' | 'pro' | 'monthly' | 'quarterly' | 'semester' | 'yearly'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- RPC ФУНКЦИИ
-- ============================================================

-- 9. RPC Функција за гласање во анкети
CREATE OR REPLACE FUNCTION increment_vote(option_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE options SET votes = votes + 1 WHERE id = option_id;
END;
$$ LANGUAGE plpgsql;

-- 10. RPC Функција за гласање за Q&A прашања
CREATE OR REPLACE FUNCTION increment_question_vote(question_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE questions SET votes = votes + 1 WHERE id = question_id;
END;
$$ LANGUAGE plpgsql;

-- 11. RPC Функција за доделување поени (Quiz Leaderboard)
CREATE OR REPLACE FUNCTION add_points(p_event_id UUID, p_username TEXT, p_pts INTEGER)
RETURNS void AS $$
BEGIN
  INSERT INTO leaderboard (event_id, username, points)
  VALUES (p_event_id, p_username, p_pts)
  ON CONFLICT (event_id, username)
  DO UPDATE SET points = leaderboard.points + p_pts, last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- AUTH TRIGGER — Автоматски креира профил при регистрација
-- ============================================================

-- 12. Функција за автоматско креирање на профил
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Корисник'),
    CASE
      WHEN NEW.email IN (
        'igor@slidea.mk',
        'admin@slidea.mk',
        'igorbogdanoski@gmail.com',
        'bogdanoskiigor@gmail.com',
        'igor@mismath.net'
      ) THEN 'admin'
      ELSE 'user'
    END,
    CASE
      WHEN NEW.email IN (
        'igor@slidea.mk',
        'admin@slidea.mk',
        'igorbogdanoski@gmail.com',
        'bogdanoskiigor@gmail.com',
        'igor@mismath.net'
      ) THEN 'pro'
      ELSE 'basic'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Trigger — се активира при секоја нова регистрација
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
