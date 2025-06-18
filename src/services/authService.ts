import api from './api';
import type { RegisterRequest, LoginRequest, AuthResponse, ChatRequest, ChatResponse, Conversation } from '../types/auth';

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
};

export const refreshToken = async (refreshToken: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
  return response.data;
};

export const sendChat = async (data: ChatRequest): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>('/chat', data);
  return response.data;
};

export const getConversationHistory = async (conversationId: string): Promise<Conversation> => {
  const response = await api.get<Conversation>(`/chat/${conversationId}`);
  return response.data;
};