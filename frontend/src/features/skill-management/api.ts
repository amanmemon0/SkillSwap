import type { SkillManagementApi, SkillCategory, SkillRequest } from "./types";

const STORAGE_KEY = "skillswap-skill-requests";
const categories: SkillCategory[] = [
  { id: "technology", name: "Technology", skills: ["React", "TypeScript", "Python", "Node.js", "Web Development"] },
  { id: "design", name: "Design", skills: ["UI/UX", "Figma", "Product Design", "Photography"] },
  { id: "languages", name: "Languages", skills: ["Spanish", "Japanese", "English"] },
  { id: "creative", name: "Creative & practical", skills: ["Guitar", "Cooking", "Public Speaking", "Pottery"] },
];

function read(): SkillRequest[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as SkillRequest[]; } catch { return []; } }
function write(items: SkillRequest[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

/**
 * Browser-persisted workflow used by the frontend. Move these operations to
 * protected backend endpoints before deploying, so the pending-request rule is
 * also enforced outside the browser.
 */
export const skillManagementApi: SkillManagementApi = {
  getCategories: async () => categories,
  getMyRequests: async (memberId) => read().filter((item) => item.requester?.id === memberId),
  requestCustomSkill: async (input) => {
    if (read().some((item) => item.requester?.id === input.requester.id && item.status === "pending")) throw new Error("A skill request is already awaiting admin approval.");
    const category = categories.find((item) => item.id === input.categoryId);
    const created: SkillRequest = { id: crypto.randomUUID(), skillName: input.skillName, categoryId: category?.id || null, categoryName: category?.name || null, status: "pending", requestedAt: new Date().toISOString(), requester: input.requester };
    write([created, ...read()]); return created;
  },
  updateRequest: async (id, input) => {
    const item = read().find((request) => request.id === id);
    if (!item) throw new Error("Skill request was not found.");
    if (item.status !== "pending") throw new Error("Only pending skill requests can be edited.");
    if (!input.skillName.trim()) throw new Error("Enter a skill name.");
    const category = categories.find((entry) => entry.id === input.categoryId);
    const updated: SkillRequest = { ...item, skillName: input.skillName.trim(), categoryId: category?.id || null, categoryName: category?.name || null };
    write(read().map((request) => request.id === id ? updated : request)); return updated;
  },
  revokeRequest: async (id) => {
    const item = read().find((request) => request.id === id);
    if (!item) throw new Error("Skill request was not found.");
    if (item.status !== "pending") throw new Error("Only pending skill requests can be revoked.");
    write(read().filter((request) => request.id !== id));
  },
  getPendingRequests: async () => read().filter((item) => item.status === "pending"),
  reviewRequest: async (id, decision, reviewerNote) => {
    const item = read().find((request) => request.id === id); if (!item) throw new Error("Skill request was not found.");
    const reviewed = { ...item, status: decision, reviewerNote }; write(read().map((request) => request.id === id ? reviewed : request)); return reviewed;
  },
};
