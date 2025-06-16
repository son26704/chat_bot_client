import { useState, useEffect }from 'react';
import { useNavigate } from 'react-router-dom';
import type { LoginRequest, RegisterRequest, User } from '../types/auth';
import { login, register, refreshToken } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const user = localStorage.getItem('user');
    if (token && user && refreshToken) {
      setAuthState({
        user: JSON.parse(user),
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const loginUser = async (data: LoginRequest) => {
    try {
      const { accessToken, refreshToken, user } = await login(data);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthState({
        user,
        token: accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
      navigate('/chat');
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const registerUser = async (data: RegisterRequest) => {
    try {
      const { accessToken, refreshToken, user } = await register(data);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthState({
        user,
        token: accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
      navigate('/chat');
    } catch (error) {
      throw new Error('Registration failed');
    }
  };

  const refreshAccessToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) throw new Error('No refresh token');
      const { accessToken } = await refreshToken(storedRefreshToken);
      localStorage.setItem('accessToken', accessToken);
      setAuthState((prev) => ({ ...prev, token: accessToken }));
    } catch (error) {
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    navigate('/login');
  };

  return {
    ...authState,
    login: loginUser,
    register: registerUser,
    logout,
    refreshAccessToken,
  };
};