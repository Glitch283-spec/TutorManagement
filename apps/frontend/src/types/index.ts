export type Role = 'parent' | 'manager' | 'tutor';

export interface Profile {
  user_id: number;
  email: string;
  full_name: string;
  role: Role;
  parent_id?: number;
  manager_id?: number;
  tutor_id?: number;
}

export type LearningMethod = 'online' | 'offline';
export type RequestStatus = 'Pending' | 'Processing' | 'Assigned' | 'Postponed' | 'Completed' | 'Cancelled' | 'Rejected';

export interface LearningRequest {
  id: number;
  parent_id: number;
  student_name: string;
  grade: string;
  subject: string;
  learning_method: LearningMethod;
  preferred_date: string;
  preferred_time: string;
  location?: string;
  special_requirements?: string;
  status: RequestStatus;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}
