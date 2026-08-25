import type { SkillManagementApi, SkillCategory, SkillRequest } from "./types";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getHeaders() {
  const token = localStorage.getItem('skillswap-token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const mockSkillsByCategory: Record<string, string[]> = {
  technology: ["React", "TypeScript", "Python", "Node.js", "Web Development"],
  development: ["React", "TypeScript", "Python", "Node.js", "Web Development"],
  design: ["UI/UX", "Figma", "Product Design", "Photography"],
  photography: ["Photography", "Composition", "Lighting"],
  languages: ["Spanish", "Japanese", "English"],
  communication: ["Public Speaking", "Writing", "Negotiation"],
  creative: ["Guitar", "Cooking", "Public Speaking", "Pottery"],
  life_skills: ["Cooking", "Baking", "First Aid"],
  business: ["Marketing", "Finance", "Strategy"],
  other: ["Other"]
};

export const skillManagementApi: SkillManagementApi = {
  getCategories: async () => {
    const res = await fetch(`${API_URL}/api/skill-requests/categories`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch skill categories.");
    const data = await res.json() as { id: string; name: string }[];
    return data.map(cat => ({
      id: cat.id,
      name: cat.name,
      skills: mockSkillsByCategory[cat.id] || []
    }));
  },

  getMyRequests: async (_memberId) => {
    const res = await fetch(`${API_URL}/api/skill-requests`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch my skill requests.");
    return await res.json() as SkillRequest[];
  },

  requestCustomSkill: async (input) => {
    const res = await fetch(`${API_URL}/api/skill-requests`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        skillName: input.skillName,
        category: input.categoryId
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create skill request.");
    return data as SkillRequest;
  },

  updateRequest: async (id, input) => {
    const res = await fetch(`${API_URL}/api/skill-requests/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({
        skillName: input.skillName,
        category: input.categoryId
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update skill request.");
    return data as SkillRequest;
  },

  revokeRequest: async (id) => {
    const res = await fetch(`${API_URL}/api/skill-requests/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Failed to revoke skill request.");
    }
  },

  getPendingRequests: async () => {
    const res = await fetch(`${API_URL}/api/admin/skill-requests`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch pending skill requests.");
    return await res.json() as SkillRequest[];
  },

  reviewRequest: async (id, decision, reviewerNote) => {
    const res = await fetch(`${API_URL}/api/admin/skill-requests/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({
        decision,
        reviewerNote
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to submit review.");
    return data as SkillRequest;
  },
};
