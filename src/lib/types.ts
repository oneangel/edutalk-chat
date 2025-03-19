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