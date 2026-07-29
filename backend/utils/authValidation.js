const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long'),
  username: z.string().trim().min(3, 'Username must be at least 3 characters long').max(24).regex(/^[a-zA-Z0-9_]+$/, 'Username can only include letters, numbers, and underscores'),
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  phone: z.string().trim().optional(),
  country: z.string().trim().min(2, 'Country is required'),
  state: z.string().trim().min(2, 'State or region is required'),
  city: z.string().trim().min(2, 'City is required'),
  bio: z.string().trim().min(20, 'Bio must be at least 20 characters long').max(280),
  primarySkill: z.string().trim().min(1, 'Primary skill is required'),
  skillLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  learningSkills: z.array(z.string().trim().min(1)).min(1, 'Choose at least one skill to learn'),
  availability: z.array(z.string().trim().min(1)).min(1, 'Choose at least one availability option'),
  learningMode: z.enum(['Online', 'Offline', 'Both']),
});

const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

module.exports = {
  registerSchema,
  loginSchema,
};
