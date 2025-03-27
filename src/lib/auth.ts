import { User } from './types';

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function removeToken() {
  localStorage.removeItem('token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function login(email: string, password: string) {
  const response = await fetch('https://edutalk-by8w.onrender.com/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json(); 
  
  if (!response.ok) {
    throw new Error(data.error || 'Invalid credentials');
  }

  return data;
}

export async function register(data: {
  username: string;
  name: string;
  lastname: string;
  email: string;
  password: string;
  grade: string;
}) {
  const response = await fetch('https://edutalk-by8w.onrender.com/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...data, type: 'student' }),
  });

  if (!response.ok) {
    throw new Error('Registration failed');
  }

  return response.json();
}