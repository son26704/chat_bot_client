// client/src/types/auth.ts
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
  systemPrompt?: string; // Thêm trường này để gửi prompt hệ thống nếu có
}

export interface ChatResponse {
  conversationId: string;
  userMessage: Message;
  assistantMessage: Message;
  memoryWorthyUserMessageId?: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
  isMemoryWorthy?: boolean; 
  attachments?: string[];
}

export interface Conversation {
  id: string;
  title: string;
  Messages: Message[];
  createdAt: string;
  updatedAt: string;
  isMemoryWorthy?: boolean; 
}

export interface FollowUpQuestionsResponse {
  suggestions: string;
}

export interface SearchWebResult {
  title: string;
  url: string;
}

export interface SearchWebResponse {
  results: SearchWebResult[];
}