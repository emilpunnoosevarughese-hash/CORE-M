import { z } from 'zod';

export const userRegistrationSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export const projectCreateSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name is too long")
    .regex(/^[\w\-\s]+$/, "Project name can only contain letters, numbers, spaces, and hyphens"),
  description: z.string().max(1000).optional(),
});

export const commentSchema = z.object({
  text: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long")
    // Prevent basic script injections (though React handles most, this is defense in depth)
    .refine(val => !val.includes('<script'), "Invalid characters detected"),
});

export const shareLinkSchema = z.object({
  projectId: z.string().uuid("Invalid project ID format").or(z.string().min(10)),
  role: z.enum(['viewer', 'editor', 'admin']),
  expiresIn: z.number().min(3600).max(31536000).optional(), // 1 hour to 1 year
});

export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
