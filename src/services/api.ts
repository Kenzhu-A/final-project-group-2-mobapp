import { Platform } from 'react-native';

// Dynamically grab the correct URL from the .env file based on the device
export const BASE_URL = Platform.OS === 'android' 
  ? process.env.EXPO_PUBLIC_API_URL_ANDROID 
  : process.env.EXPO_PUBLIC_API_URL_IOS;

  console.log("MY API URL IS:", BASE_URL);

export const api = {
  // 1. Standard Login
  login: async (email: string, password: string) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  // 2. Standard Registration
  register: async (email: string, password: string, full_name: string) => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  // 3. Google Login Link
  getGoogleAuthUrl: async () => {
    const response = await fetch(`${BASE_URL}/auth/google`, {
      method: 'GET',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to initialize Google login');
    return data.url;
  },

  // NEW: Fetch all users to chat with
  getUsers: async (currentUserId: string) => {
    const response = await fetch(`${BASE_URL}/messages/users/${currentUserId}`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return await response.json();
  },

  // NEW: Fetch chat history
  getMessages: async (user1: string, user2: string) => {
    const response = await fetch(`${BASE_URL}/messages/history/${user1}/${user2}`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return await response.json();
  }
};