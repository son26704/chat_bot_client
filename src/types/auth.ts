export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ChatRequest {
  prompt: string;
  conversationId?: string;
}

export interface ChatResponse {
  conversationId: string;
  message: Message;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  Messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpQuestionsResponse {
  suggestions: string;
}