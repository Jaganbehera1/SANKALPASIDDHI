/*
  # School Admission Portal Schema

  1. New Tables
    - `user_roles`: Stores user role assignments (clerk, headmaster)
    - `applications`: Student admission applications with all details and photo
    - `application_approvals`: Tracks HM approval/rejection with remarks

  2. Security
    - Enable RLS on all tables
    - Add policies for public form submission, clerk access, and HM access
    - Restrict data based on user roles and ownership
*/

-- Create user roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('student', 'clerk', 'headmaster')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Student Details
  student_full_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  blood_group text,
  nationality text DEFAULT 'Indian',
  
  -- Parent/Guardian Details
  father_name text NOT NULL,
  mother_name text,
  guardian_name text,
  guardian_contact text NOT NULL,
  guardian_email text NOT NULL,
  
  -- Address
  current_address text NOT NULL,
  permanent_address text,
  city text NOT NULL,
  state text NOT NULL,
  pin_code text NOT NULL,
  
  -- Previous School
  previous_school_name text,
  previous_class text,
  previous_year_passing text,
  
  -- Admission Details
  applying_class text NOT NULL,
  academic_year text NOT NULL,
  
  -- Photo
  photo_url text,
  
  -- Status and Metadata
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'sent_to_hm', 'approved', 'rejected')),
  submitted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit applications"
  ON applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Clerks can view all applications"
  ON applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('clerk', 'headmaster')
    )
  );

CREATE POLICY "Headmasters can view applications sent to them"
  ON applications FOR SELECT
  TO authenticated
  USING (
    status IN ('sent_to_hm', 'approved', 'rejected')
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'headmaster'
    )
  );

CREATE POLICY "Clerks can update status"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'clerk'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'clerk'
    )
  );

-- Create application approvals table
CREATE TABLE IF NOT EXISTS application_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  approved_by uuid NOT NULL REFERENCES auth.users(id),
  decision text NOT NULL CHECK (decision IN ('approved', 'rejected')),
  remarks text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE application_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HMs can create approvals"
  ON application_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    approved_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'headmaster'
    )
  );

CREATE POLICY "HMs can view approvals"
  ON application_approvals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'headmaster'
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_submitted_by ON applications(submitted_by);
CREATE INDEX IF NOT EXISTS idx_application_approvals_application_id ON application_approvals(application_id);
