export interface User {
  id: string;
  email: string;
  type: string;
  username?: string;
  name?: string;
  lastname?: string;
  grade?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
}

export interface Conversation {
  id: string;                          
  participant_one_id: string;           
  participant_two_id: string;           
  created_at: string;                  
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  state: 'pending' | 'unread' | 'seen';
  status: boolean;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  avatar: string;
}

export interface Assignment {
  id: string;
  title: string;
  course_id: string;
  delivery_date: string;
  status: boolean;
  description: string;
  courseName: string;
  teacherName: string;
}

export interface Submission {
  id: string;
  student_id: string;
  student?: User; 
  file_url: string;
  grade: number | null;
  createdAt: string;
  status: 'pending' | 'submitted' | 'late' | 'graded';
}

export type UserType = "student" | "teacher";