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
  getMyPets: async (userId: string) => {
    const response = await fetch(`${BASE_URL}/pets/my-pets/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch your pets');
    return await response.json();
  },

  updatePetStatus: async (petId: string, status: string) => {
    const response = await fetch(`${BASE_URL}/pets/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ petId, status }),
    });
    if (!response.ok) throw new Error('Failed to update status');
    return await response.json();
  },

  // [UPLOAD-PROGRESS] XHR-based so we can surface upload progress per image
  uploadPetImage: (formData: FormData, onProgress?: (percent: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE_URL}/pets/image`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(data.image_url);
          else reject(new Error(data.error || 'Pet image upload failed'));
        } catch (e) {
          reject(new Error('Pet image upload: invalid response'));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during pet image upload'));
      xhr.send(formData);
    });
  },

  // --- GOOGLE AUTH API ---
  getGoogleAuthUrl: async () => {
    const response = await fetch(`${BASE_URL}/auth/google`);
    if (!response.ok) throw new Error('Google auth failed');
    return await response.json();
  },

  verifyGoogleToken: async (access_token: string) => {
    const response = await fetch(`${BASE_URL}/auth/google/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to verify Google token');
    return data.userId;
  },
  deleteAccount: async (userId: string) => {
    const response = await fetch(`${BASE_URL}/users/${userId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete account');
  },
  deleteGeneralPost: async (postId: string) => {
    const response = await fetch(`${BASE_URL}/posts/${postId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete post');
  },
  deletePetPost: async (petId: string) => {
    const response = await fetch(`${BASE_URL}/pets/${petId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete pet post');
  },
  deleteMessage: async (messageId: string) => {
    const response = await fetch(`${BASE_URL}/messages/message/${messageId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete message');
  },
  deleteConversation: async (user1: string, user2: string) => {
    const response = await fetch(`${BASE_URL}/messages/conversation/${user1}/${user2}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete conversation');
  },
  // --- LOST AND FOUND API ---
  getLostAndFoundReports: async () => {
    const response = await fetch(`${BASE_URL}/lost-and-found`);
    if (!response.ok) throw new Error('Failed to fetch reports');
    return await response.json();
  },
  createLostAndFoundReport: async (reportData: any) => {
    const response = await fetch(`${BASE_URL}/lost-and-found/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    if (!response.ok) throw new Error('Failed to create report');
    return await response.json();
  },
  uploadLostAndFoundImage: async (formData: FormData) => {
    const response = await fetch(`${BASE_URL}/lost-and-found/image`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Image upload failed');
    return data.image_url;
  },
  resolveLostAndFoundReport: async (reportId: string) => {
    const response = await fetch(`${BASE_URL}/lost-and-found/resolve/${reportId}`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to resolve report');
  },
  getConversations: async (userId: string) => {
    const response = await fetch(`${BASE_URL}/messages/conversations/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return await response.json();
  },
  editMessage: async (messageId: string, text: string) => {
    const response = await fetch(`${BASE_URL}/messages/message/${messageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error('Failed to edit message');
    return await response.json();
  },
  getPetDetails: async (petId: string) => {
    const response = await fetch(`${BASE_URL}/pets/${petId}`);
    if (!response.ok) throw new Error('Failed to fetch pet details');
    return await response.json();
  },
  // --- ADMIN API ---
  getAdminStats: async () => {
    const response = await fetch(`${BASE_URL}/admin/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return await response.json();
  },
  getAnnouncements: async () => {
    const response = await fetch(`${BASE_URL}/admin/announcements`);
    if (!response.ok) throw new Error('Failed to fetch announcements');
    return await response.json();
  },
  createAnnouncement: async (data: { title: string, content: string, author_id: string }) => {
    const response = await fetch(`${BASE_URL}/admin/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create announcement');
    return await response.json();
  },
  deleteAnnouncement: async (id: string) => {
    const response = await fetch(`${BASE_URL}/admin/announcements/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete announcement');
  },
  getAllSystemPosts: async () => {
    const response = await fetch(`${BASE_URL}/admin/posts`);
    if (!response.ok) throw new Error('Failed to fetch posts');
    return await response.json();
  },
  deleteSystemPost: async (id: string) => {
    const response = await fetch(`${BASE_URL}/admin/posts/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete post');
  },
  getActivityLogs: async () => {
    const response = await fetch(`${BASE_URL}/admin/logs`);
    if (!response.ok) throw new Error('Failed to fetch logs');
    return await response.json();
  },

  // [SAVED-PETS]
  savePet: async (userId: string, petId: string) => {
    const response = await fetch(`${BASE_URL}/saved-pets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, pet_id: petId }),
    });
    if (!response.ok) throw new Error('Failed to save pet');
    return await response.json();
  },

  // [SAVED-PETS]
  getSavedPets: async (userId: string) => {
    const response = await fetch(`${BASE_URL}/saved-pets/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch saved pets');
    return await response.json();
  },

  // [SAVED-PETS]
  unsavePet: async (userId: string, petId: string) => {
    const response = await fetch(`${BASE_URL}/saved-pets/${userId}/${petId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to unsave pet');
  },

  // [PET-EDIT]
  updatePetPost: async (petId: string, payload: any) => {
    const response = await fetch(`${BASE_URL}/pets/${petId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update pet');
    }
    return await response.json();
  },

  // [PUSH-NOTIF]
  registerPushToken: async (userId: string, token: string) => {
    const response = await fetch(`${BASE_URL}/users/push-token`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, expo_push_token: token }),
    });
    if (!response.ok) throw new Error('Failed to register push token');
  },

  // [LIKED-POSTS]
  likePet: async (petId: string, increment: boolean) => {
    const response = await fetch(`${BASE_URL}/pets/${petId}/like`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ increment }),
    });
    if (!response.ok) throw new Error('Failed to update pet like');
    return await response.json(); // { likes_count: number }
  },
};

