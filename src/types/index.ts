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
