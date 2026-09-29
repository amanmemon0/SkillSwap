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
  credits: number;
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

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error: any) {
    throw new Error(`Can't reach the SkillSwap API (${API_URL}) — check your connection or backend status. (Error: ${error?.message || 'Network request failed'})`);
  }

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

  /**
   * Step 1: Send reset-link email. Only requires { email }.
   * Always returns a generic message regardless of whether the email exists.
   */
  requestPasswordReset: async (payload: { email: string }): Promise<{ message: string }> => {
    return request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Step 2: Consume the token and set a new password.
   * Requires { token, newPassword }.
   */
  resetPassword: async (payload: { token: string; newPassword: string }): Promise<{ message: string }> => {
    return request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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

  getNotifications: async (): Promise<any[]> => {
    return request<any[]>('/api/notifications');
  },

  markNotificationRead: async (id: string | number): Promise<any> => {
    return request<any>(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllNotificationsRead: async (): Promise<any> => {
    return request<any>('/api/notifications/read-all', {
      method: 'PUT',
    });
  },

  createExchange: async (payload: { receiverId: string; senderSkillId: string; receiverSkillId: string; message?: string }): Promise<any> => {
    return request<any>('/api/exchanges', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getExchanges: async (): Promise<any[]> => {
    return request<any[]>('/api/exchanges');
  },

  updateExchangeStatus: async (id: string | number, status: string): Promise<any> => {
    return request<any>(`/api/exchanges/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  getSkills: () => request<any[]>('/api/skills'),
  getProfiles: (search?: string) => request<any[]>(`/api/auth/profiles${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  adminGetTable: (table: string, page = 1, pageSize = 25) => request<{ table: string; rows: Record<string, unknown>[]; total: number; page: number; pageSize: number }>(`/api/auth/admin/tables/${encodeURIComponent(table)}?page=${page}&pageSize=${pageSize}`),
  adminGetOverviewMetrics: () => request<{
    totalUsers: number;
    activeCourses: number;
    pendingCourses: number;
    totalExchanges: number;
    recentActivity: {
      newEnrollments30d: number;
      newCourses30d: number;
      newExchanges30d: number;
    };
  }>('/api/auth/admin/analytics/overview'),
  adminGetRegistrationAnalytics: (days = 30) => request<{ date: string; count: number }[]>(`/api/auth/admin/analytics/registrations?days=${days}`),

  // ── Courses ───────────────────────────────────────────────────────────────
  listCourses: () => request<any[]>('/api/courses'),
  getCourse: (id: string) => request<any>(`/api/courses/${id}`),
  /**
   * Create a new course. Status is forced to 'pending_review' by the backend
   * regardless of what the client sends.
   */
  createCourse: (payload: { skillName: string; title: string; description?: string; creditCost?: number; category?: string }) =>
    request<any>('/api/courses', { method: 'POST', body: JSON.stringify(payload) }),
  getMyLearning: () => request<any[]>('/api/courses/mine/learning'),
  getMyTeaching: () => request<any[]>('/api/courses/mine/teaching'),
  getCourseEnrollments: (courseId: string) => request<any[]>(`/api/courses/${courseId}/enrollments`),

  // ── Admin moderation ──────────────────────────────────────────────────────
  adminListPendingCourses: () => request<any[]>('/api/courses/admin/pending'),
  adminModerateCourse: (courseId: string, decision: 'approved' | 'rejected', note?: string) =>
    request<any>(`/api/courses/${courseId}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ decision, note }),
    }),

  // ── Lectures ──────────────────────────────────────────────────────────────
  getLectures: (courseId: string) => request<any[]>(`/api/courses/${courseId}/lectures`),
  createLecture: (courseId: string, payload: { title: string; description?: string; durationMinutes?: number; scheduledAt?: string | null; order: number }) =>
    request<any>(`/api/courses/${courseId}/lectures`, { method: 'POST', body: JSON.stringify(payload) }),
  updateLecture: (lectureId: string, payload: Partial<{ title: string; description: string; order: number; durationMinutes: number; scheduledAt: string | null; status: string }>) =>
    request<any>(`/api/courses/lectures/${lectureId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteLecture: (lectureId: string) =>
    request<any>(`/api/courses/lectures/${lectureId}`, { method: 'DELETE' }),

  enrollCourse: (courseId: string) => request<any>(`/api/courses/${courseId}/enroll`, { method: 'POST' }),
  markAttendance: (lectureId: string) => request<any>(`/api/courses/lectures/${lectureId}/attendance`, { method: 'PUT', body: JSON.stringify({ status: 'present', minutesAttended: 45 }) }),
  requestExam: (courseId: string) => request<any>(`/api/courses/${courseId}/exam-request`, { method: 'POST' }),
  scheduleExam: (courseId: string, learnerId: string) => request<any>(`/api/courses/${courseId}/enrollments/${learnerId}/exam-status`, { method: 'PATCH', body: JSON.stringify({ status: 'scheduled' }) }),
  getExam: (courseId: string) => request<any>(`/api/courses/${courseId}/exam`),
  submitExam: (examId: string, answers: (number | null)[]) => request<any>(`/api/courses/exams/${examId}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  requestCertificate: (courseId: string) => request<any>(`/api/courses/${courseId}/certificate-requests`, { method: 'POST' }),
  getCertificateRequests: (scope: 'mine' | 'teaching') => request<any[]>(`/api/courses/certificate-requests?scope=${scope}`),
  decideCertificateAsTeacher: (id: string, decision: 'approved' | 'rejected') => request<any>(`/api/courses/certificate-requests/${id}/tutor-decision`, { method: 'PATCH', body: JSON.stringify({ decision }) }),
  decideCertificateAsAdmin: (id: string, decision: 'approved' | 'rejected') => request<any>(`/api/courses/certificate-requests/${id}/admin-decision`, { method: 'PATCH', body: JSON.stringify({ decision }) }),
  getMyCertificates: () => request<any[]>('/api/courses/certificates/mine'),
  verifyCertificate: (number: string) => request<any>(`/api/courses/certificates/verify/${encodeURIComponent(number)}`),
  getLectureMessages: (lectureId: string) => request<any[]>(`/api/lectures/${lectureId}/messages`),
  postLectureMessage: (lectureId: string, body: string) => request<any>(`/api/lectures/${lectureId}/messages`, { method: 'POST', body: JSON.stringify({ body }) }),

  getConversations: () => request<any[]>('/api/conversations'),
  createConversation: (recipientId: string) => request<any>('/api/conversations', { method: 'POST', body: JSON.stringify({ recipientId }) }),
  getMessages: (conversationId: string) => request<any[]>(`/api/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, body: string) => request<any>(`/api/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ body }) }),

  // Compatibility & User Profiles
  getCompatibility: (userId: string) => request<any>(`/api/matches/${userId}`),
  getUserProfile: (userId: string) => request<any>(`/api/users/${userId}`),
  getUsers: () => request<any[]>('/api/users'),
  submitReview: (userId: string, payload: { rating: number; comment?: string; exchangeId?: string }) =>
    request<any>(`/api/users/${userId}/reviews`, { method: 'POST', body: JSON.stringify(payload) }),

  logout: () => {
    clearToken();
  },
};
