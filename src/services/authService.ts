// client/src/services/authService.ts
import api from "./api";
import io from 'socket.io-client';

type Socket = ReturnType<typeof io>;

import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  ChatRequest,
  ChatResponse,
  Conversation,
  FollowUpQuestionsResponse,
} from "../types/auth";

let socket: (Socket | null) = null;

export const initSocket = (token: string) => {
  if (socket) {
    socket.disconnect();
  }
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
    autoConnect: true,
    auth: { token: `Bearer ${token}` },
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const register = async (
  data: RegisterRequest
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/register", data);
  return response.data;
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", data);
  return response.data;
};

export const refreshToken = async (
  refreshToken: string
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/refresh", {
    refreshToken,
  });
  return response.data;
};

export const sendChat = async (data: ChatRequest): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>("/chat", data);
  return response.data;
};

export const getConversationHistory = async (
  conversationId: string
): Promise<Conversation> => {
  const response = await api.get<Conversation>(`/chat/${conversationId}`);
  return response.data;
};

export const getUserConversations = async (): Promise<Conversation[]> => {
  const response = await api.get<Conversation[]>("/conversations");
  return response.data;
};

export const deleteConversation = async (
  conversationId: string
): Promise<void> => {
  await api.delete(`/conversations/${conversationId}`);
};

export const sendChatSocket = (data: ChatRequest): Promise<ChatResponse> => {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not initialized'));
      return;
    }

    socket.emit('send_message', data, (response: { success: boolean; data?: ChatResponse; error?: string }) => {
      if (response.success && response.data) {
        resolve(response.data);
      } else {
        reject(new Error(response.error || 'Failed to send message'));
      }
    });
  });
};

export const renameConversation = async (
  conversationId: string,
  title: string
): Promise<void> => {
  await api.patch(`/conversations/${conversationId}`, { title });
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  await api.delete(`/messages/${messageId}`);
};

export const editMessage = async (messageId: string, newContent: string): Promise<ChatResponse> => {
  const response = await api.patch<ChatResponse>(`/messages/${messageId}`, { newContent });
  return response.data;
};

export const getFollowUpQuestions = async (conversationId: string): Promise<FollowUpQuestionsResponse> => {
  const response = await api.get<FollowUpQuestionsResponse>(`/chat/${conversationId}/follow-up`);
  return response.data;
};

export const getUserProfile = async (): Promise<Record<string, string>> => {
  const response = await api.get<Record<string, string>>('/profile');
  return response.data;
};


export const updateUserProfile = async (data: Record<string, string>) => {
  return await api.put('/profile', data);
};

export const getSuggestedProfileFromMessage = async (
  messageId: string
): Promise<Record<string, string>> => {
  try {
    const res = await api.get<{ result: string }>(`/profile/suggest-from-message/${messageId}`);
    
    const cleanResult = res.data.result.replace(/```json|```/g, "").trim();
    
    const parsed = JSON.parse(cleanResult);
    
    if (!parsed.profile) {
      return {};
    }
    
    return parsed.profile;
  } catch (error) {
    throw error;
  }
};

export const getSuggestedProfileFromConversation = async (
  conversationId: string
): Promise<Record<string, string>> => {
  try {
    const res = await api.get<{ result: string }>(`/profile/suggest-from-conversation/${conversationId}`);
    
    const cleanResult = res.data.result.replace(/```json|```/g, "").trim();
    
    const parsed = JSON.parse(cleanResult);
    
    if (!parsed.profile) {
      return {};
    }
    
    return parsed.profile;
  } catch (error) {
    throw error;
  }
};
