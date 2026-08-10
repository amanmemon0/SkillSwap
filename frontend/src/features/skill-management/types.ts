export type SkillRequestStatus = "pending" | "approved" | "rejected";

export interface SkillCategory {
  id: string;
  name: string;
  skills: string[];
}

export interface SkillRequest {
  id: string;
  skillName: string;
  categoryId: string | null;
  categoryName: string | null;
  status: SkillRequestStatus;
  requestedAt: string;
  reviewerNote?: string;
  requester?: { id: string; name: string; email: string };
}

export interface SkillManagementApi {
  getCategories(): Promise<SkillCategory[]>;
  getMyRequests(memberId: string): Promise<SkillRequest[]>;
  requestCustomSkill(input: { skillName: string; categoryId?: string; requester: NonNullable<SkillRequest["requester"]> }): Promise<SkillRequest>;
  getPendingRequests(): Promise<SkillRequest[]>;
  reviewRequest(id: string, decision: "approved" | "rejected", reviewerNote?: string): Promise<SkillRequest>;
}
