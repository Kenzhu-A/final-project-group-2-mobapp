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
  forgotPassword: async (email: string) => {
    const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  // --- HARDENED OTP VERIFICATION ---
  verifyOtp: async (email: string, otp: string) => {
    const response = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await response.json();
    if (!response.ok) {
        // Fallback safety to ensure it throws a clear string, not an undefined object
        throw new Error(data?.error || 'Failed to verify OTP');
    }
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
  },

  // Add these inside your export const api = { ... } block:
  
  createPetPost: async (petData: any) => {
    const response = await fetch(`${BASE_URL}/pets/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(petData),
    });
    if (!response.ok) throw new Error('Failed to create post');
    return await response.json();
  },

  getAllPets: async () => {
    const response = await fetch(`${BASE_URL}/pets`);
    if (!response.ok) throw new Error('Failed to fetch pets');
    return await response.json();
  },

  // Fetch user details for the profile
  getUserProfile: async (userId: string) => {
    const response = await fetch(`${BASE_URL}/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user data');
    return await response.json();
  },

  // Upload Avatar
  uploadAvatar: async (formData: FormData) => {
    const response = await fetch(`${BASE_URL}/users/avatar`, {
      method: 'POST',
      body: formData,
      // NOTE: Do not set Content-Type header manually when using FormData in React Native! 
      // Fetch will automatically set the correct multi-part boundary.
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Avatar upload failed');
    return data.avatar_url;
  },

  updateProfile: async (userId: string, fullName: string) => {
    const response = await fetch(`${BASE_URL}/users/update-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, full_name: fullName }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  updatePassword: async (userId: string, newPassword: string) => {
    const response = await fetch(`${BASE_URL}/users/update-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },
  // --- NEW: GENERAL POSTS API ---
  createGeneralPost: async (postData: any) => {
    const response = await fetch(`${BASE_URL}/posts/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    });
    if (!response.ok) throw new Error('Failed to create general post');
    return await response.json();
  },

  getGeneralPosts: async () => {
    const response = await fetch(`${BASE_URL}/posts`);
    if (!response.ok) throw new Error('Failed to fetch general posts');
    return await response.json();
  },

  uploadPostImage: async (formData: FormData) => {
    const response = await fetch(`${BASE_URL}/posts/image`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Image upload failed');
    return data.image_url;
  },

  updateLikeCount: async (postId: string, increment: boolean) => {
    const response = await fetch(`${BASE_URL}/posts/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, increment }),
    });
    if (!response.ok) throw new Error('Failed to update likes');
    return await response.json();
  },

  getComments: async (postId: string) => {
    const response = await fetch(`${BASE_URL}/posts/${postId}/comments`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    return await response.json();
  },

  addComment: async (postId: string, userId: string, text: string) => {
    const response = await fetch(`${BASE_URL}/posts/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, user_id: userId, text }),
    });
    if (!response.ok) throw new Error('Failed to add comment');
    return await response.json();
  },
};

