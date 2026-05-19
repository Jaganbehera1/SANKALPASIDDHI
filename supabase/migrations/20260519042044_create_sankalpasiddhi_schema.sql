/*
  # Sankalpasiddhi Study Platform Schema

  ## Overview
  This migration creates the full schema for the Sankalpasiddhi Sanskrit study platform.

  ## New Tables

  ### 1. `videos`
  Stores the YouTube video lessons.
  - `id` (uuid, PK)
  - `topic` (text) - Video title/topic
  - `youtube_url` (text) - YouTube embed URL
  - `description` (text) - Optional description
  - `duration` (text) - Display duration badge (e.g., "12 min")
  - `added_on` (timestamptz)

  ### 2. `unique_codes`
  Stores student access codes for mock tests.
  - `id` (uuid, PK)
  - `code` (text, unique) - The unique access code
  - `student_name` (text) - Student's name
  - `used` (boolean) - Whether the code has been used
  - `used_on` (timestamptz, nullable)
  - `test_score` (int, nullable) - Score after test

  ### 3. `test_results`
  Stores completed test results.
  - `id` (uuid, PK)
  - `student_name` (text)
  - `code` (text)
  - `score` (int)
  - `total_questions` (int)
  - `percentage` (numeric)
  - `completed_on` (timestamptz)

  ### 4. `questions`
  Stores the Sanskrit mock test questions.
  - `id` (uuid, PK)
  - `text` (text) - Question text in Sanskrit
  - `option_a` (text)
  - `option_b` (text)
  - `option_c` (text)
  - `option_d` (text)
  - `correct_answer` (text) - 'A', 'B', 'C', or 'D'
  - `sort_order` (int) - Display order

  ## Security
  - RLS enabled on all tables
  - Public read access for questions and videos (students need to read)
  - Public read access for unique_codes (for code validation)
  - Public insert for test_results (students submit results)
  - Public update for unique_codes used status (mark code as used)
  - Admin operations use service role or anon with specific policies
*/

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL DEFAULT '',
  youtube_url text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '10 min',
  added_on timestamptz DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view videos"
  ON videos FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert videos"
  ON videos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update videos"
  ON videos FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete videos"
  ON videos FOR DELETE
  TO anon, authenticated
  USING (true);

-- Unique codes table
CREATE TABLE IF NOT EXISTS unique_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  student_name text NOT NULL DEFAULT '',
  used boolean NOT NULL DEFAULT false,
  used_on timestamptz,
  test_score int
);

ALTER TABLE unique_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view codes"
  ON unique_codes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert codes"
  ON unique_codes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update codes"
  ON unique_codes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Test results table
CREATE TABLE IF NOT EXISTS test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL DEFAULT '',
  code text NOT NULL DEFAULT '',
  score int NOT NULL DEFAULT 0,
  total_questions int NOT NULL DEFAULT 5,
  percentage numeric(5,2) NOT NULL DEFAULT 0,
  completed_on timestamptz DEFAULT now()
);

ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view test results"
  ON test_results FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert test results"
  ON test_results FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL DEFAULT '',
  option_a text NOT NULL DEFAULT '',
  option_b text NOT NULL DEFAULT '',
  option_c text NOT NULL DEFAULT '',
  option_d text NOT NULL DEFAULT '',
  correct_answer text NOT NULL DEFAULT 'A',
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions"
  ON questions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert questions"
  ON questions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update questions"
  ON questions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete questions"
  ON questions FOR DELETE
  TO anon, authenticated
  USING (true);

-- Seed: default videos
INSERT INTO videos (topic, youtube_url, description, duration) VALUES
  ('Introduction to Sanskrit', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'A beginner-friendly introduction to the Sanskrit language, its history and importance.', '15 min'),
  ('Basic Grammar Rules', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Core grammatical rules including vibhakti, sandhi, and sentence structure.', '22 min'),
  ('Common Sanskrit Words', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Vocabulary building with frequently used Sanskrit words in daily life.', '18 min'),
  ('Sentence Formation', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Learn how to construct simple and complex sentences in Sanskrit.', '25 min'),
  ('Pronunciation Guide', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Correct pronunciation of Sanskrit alphabets and words with examples.', '20 min')
ON CONFLICT DO NOTHING;

-- Seed: default unique codes
INSERT INTO unique_codes (code, student_name, used) VALUES
  ('SANKALPA001', 'Aarav Sharma', false),
  ('SANKALPA002', 'Vihaan Gupta', false),
  ('SANKALPA003', 'Anaya Patel', false)
ON CONFLICT (code) DO NOTHING;

-- Seed: Sanskrit questions
INSERT INTO questions (text, option_a, option_b, option_c, option_d, correct_answer, sort_order) VALUES
  (
    'रामः ______ फलम् खादति (Choose the correct word)',
    'सः',
    'रामेण',
    'रामम्',
    'रामाय',
    'A',
    1
  ),
  (
    '"गच्छति" इत्यस्य धातुः कः? (What is the root of "Gachchati"?)',
    'पठ्',
    'गम्',
    'भू',
    'अस्',
    'B',
    2
  ),
  (
    '"विद्यालयः" इत्यस्य सन्धिविच्छेदः कः? (Split the Sandhi)',
    'विद्या + अलयः',
    'विद्यायाः + आलयः',
    'विद्या + लयः',
    'विद् + यालयः',
    'B',
    3
  ),
  (
    '"बालकः पुस्तकम् पठति" - अत्र कर्तृपदं किम्? (What is the subject?)',
    'पुस्तकम्',
    'पठति',
    'बालकः',
    'न किमपि',
    'C',
    4
  ),
  (
    '"नमः" इत्यस्य पर्यायवाचकं किम्? (Synonym of Namah?)',
    'प्रणामः',
    'क्रोधः',
    'हर्षः',
    'दुःखम्',
    'A',
    5
  )
ON CONFLICT DO NOTHING;
