const { z } = require('zod');

const category = z.enum(['development', 'languages', 'design', 'photography', 'business', 'communication', 'life_skills', 'other']);
const uuid = z.string().uuid();

const skillRequestSchema = z.object({ skillName: z.string().trim().min(1).max(120), category: category.optional().nullable() });
const reviewSkillRequestSchema = z.object({ decision: z.enum(['approved', 'rejected']), reviewerNote: z.string().trim().max(500).optional() });

// Added 'pending_review' status for course moderation workflow:
// draft → pending_review (on submit) → published (admin approves) | archived (admin rejects)
const courseSchema = z.object({
  skillId: uuid.optional().nullable(),
  skillName: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).optional().nullable(),
  creditCost: z.number().int().min(0).max(10000).optional(),
  category: category.optional().nullable(),
  status: z.enum(['draft', 'pending_review', 'published', 'archived']).optional(),
});

const datetimeSchema = z.union([
  z.string().datetime({ offset: true }),
  z.string().datetime(),
  z.string().refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid datetime format' }),
  z.literal(''),
  z.null(),
]).optional().nullable();

const lectureSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).optional().nullable().or(z.literal('')),
  order: z.number().int().min(1).optional(),
  durationMinutes: z.number().int().min(0).optional(),
  scheduledAt: datetimeSchema,
  status: z.enum(['upcoming', 'live', 'in-progress', 'completed']).optional(),
});
const attendanceSchema = z.object({ status: z.enum(['present', 'absent']).optional(), joinedAt: z.string().datetime().optional().nullable(), leftAt: z.string().datetime().optional().nullable(), minutesAttended: z.number().int().min(0).optional() });
const examSchema = z.object({ title: z.string().trim().min(1).max(160), description: z.string().trim().max(4000).optional().nullable(), timeLimitMins: z.number().int().min(0).optional(), passMarkPercentage: z.number().min(0).max(100).optional(), status: z.enum(['active', 'inactive']).optional() });
const questionSchema = z.object({ questionText: z.string().trim().min(1).max(4000), options: z.array(z.string().trim().min(1)).min(2), correctOptionIdx: z.number().int().min(0), order: z.number().int().min(1) }).refine((value) => value.correctOptionIdx < value.options.length, { message: 'correctOptionIdx must reference an option', path: ['correctOptionIdx'] });
const examSubmitSchema = z.object({ answers: z.union([z.array(z.number().int().nullable()), z.record(z.string(), z.number().int().nullable())]) });
const certificateDecisionSchema = z.object({ decision: z.enum(['approved', 'rejected']) });
const messageSchema = z.object({ body: z.string().trim().min(1).max(4000) });
const reactionSchema = z.object({ reactionType: z.string().trim().min(1).max(50) });
const moderationDecisionSchema = z.object({ decision: z.enum(['approved', 'rejected']), note: z.string().trim().max(500).optional() });

module.exports = {
  skillRequestSchema, reviewSkillRequestSchema, courseSchema, lectureSchema,
  attendanceSchema, examSchema, questionSchema, examSubmitSchema,
  certificateDecisionSchema, messageSchema, reactionSchema, moderationDecisionSchema,
};
