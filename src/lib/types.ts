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