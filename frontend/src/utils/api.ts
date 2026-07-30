const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface UserResponse {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  location: string;
  username: string;
  phone: string;
  bio: string;
  primary_skill: string;
  skill_level: string;
  learning_skills: string[];
  availability: string[];
  learning_mode: string;
  token?: string;
}


export function getToken(): string | null {
  return localStorage.getItem('skillswap-token');
}

export function setToken(token: string) {
  localStorage.setItem('skillswap-token', token);
}

export function clearToken() {
  localStorage.removeItem('skillswap-token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data as T;
}

export const api = {
  login: async (payload: Record<string, any>): Promise<UserResponse> => {
    const data = await request<UserResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  register: async (payload: Record<string, any>): Promise<UserResponse> => {
    const data = await request<UserResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  getMe: async (): Promise<UserResponse> => {
    return request<UserResponse>('/api/auth/me');
  },

  updateProfile: async (payload: {
    name?: string;
    location?: string;
    phone?: string;
    bio?: string;
    primarySkill?: string;
    skillLevel?: string;
    learningSkills?: string[];
    availability?: string[];
    learningMode?: string;
  }): Promise<UserResponse> => {
    return request<UserResponse>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  adminGetUsers: async (): Promise<any[]> => {
    return request<any[]>('/api/auth/admin/users');
  },

  adminUpdateUser: async (id: string | number, payload: { status?: string; role?: string }): Promise<any> => {
    return request<any>(`/api/auth/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  adminDeleteUser: async (id: string | number): Promise<any> => {
    return request<any>(`/api/auth/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  logout: () => {
    clearToken();
  },
};

