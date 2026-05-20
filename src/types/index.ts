export interface Video {
  id: string;
  topic: string;
  youtube_url: string;
  description: string;
  duration: string;
  added_on: string;
}

export interface UniqueCode {
  id: string;
  code: string;
  student_name: string;
  used: boolean;
  used_on: string | null;
  test_score: number | null;
}

export interface TestResult {
  id: string;
  student_name: string;
  code: string;
  score: number;
  total_questions: number;
  percentage: number;
  completed_on: string;
}

export interface Question {
  id: string;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  sort_order: number;
}
export interface TestResult {
  id: string;
  student_name: string;
  code: string;
  score: number;
  total_questions: number;
  percentage: number;
  completed_on: string;
}

export interface Video {
  id: string;
  topic: string;
  youtube_url: string;
  description: string;
  duration: string;
  thumbnail?: string;
  added_on: string;
}

export interface Question {
  id: string;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  sort_order: number;
}

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: 'pdf' | 'doc' | 'ppt' | 'video' | 'audio';
  subject: string;
  size: string;
  created_at: string;
  downloads: number;
}

export interface LiveClass {
  id: string;
  title: string;
  youtube_stream_url: string;
  scheduled_at: string;
  duration: string;
  description: string;
  is_live: boolean;
  created_at: string;
  viewers: number;
}