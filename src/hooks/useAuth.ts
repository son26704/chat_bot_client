import { useState, useEffect }from 'react';
import { useNavigate } from 'react-router-dom';
import type { LoginRequest, RegisterRequest, User } from '../types/auth';
import { login, register } from '../services/authService';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
    });

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            setAuthState({
                user: JSON.parse(user),
                token,
                isAuthenticated: true,
                isLoading: false,
            });
        } else {
            setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
    }, []);

    const loginUser = async (data: LoginRequest) => {
        try {
            const response = await login(data);
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            setAuthState({
                user: response.user,
                token: response.token,
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
      const { token, user } = await register(data);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      navigate('/chat');
    } catch (error) {
      throw new Error('Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      token: null,
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
    };
}