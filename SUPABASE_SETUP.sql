-- 1. Функција за зголемување на гласови за опција (Polls/Quiz)
CREATE OR REPLACE FUNCTION increment_vote(option_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE options SET votes = votes + 1 WHERE id = option_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Функција за зголемување на гласови за прашање (Q&A)
CREATE OR REPLACE FUNCTION increment_question_vote(question_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE questions SET votes = votes + 1 WHERE id = question_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Функција за доделување поени (Quiz Leaderboard)
CREATE OR REPLACE FUNCTION add_points(p_event_id UUID, p_username TEXT, p_pts INTEGER)
RETURNS void AS $$
BEGIN
  INSERT INTO leaderboard (event_id, username, points)
  VALUES (p_event_id, p_username, p_pts)
  ON CONFLICT (event_id, username)
  DO UPDATE SET points = leaderboard.points + p_pts, last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. Табели (ако не се веќе креирани)
-- Додадете ги овие ако Supabase автоматски не ги креираше преку апликацијата

/*
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE,
  title TEXT,
  active_poll_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  question TEXT,
  type TEXT DEFAULT 'poll',
  is_quiz BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT,
  votes INTEGER DEFAULT 0,
  is_correct BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  text TEXT,
  author TEXT,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  username TEXT,
  points INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, username)
);
*/
