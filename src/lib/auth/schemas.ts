import { z } from "zod";
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const nameSchema = z.string().trim().min(1).max(80);
export const passwordSchema = z.string().min(12).max(128);
export const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const colorSchema = z.enum(["blue", "pink", "green", "purple"]);
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
export const setupSchema = z.object({
  secret: z.string().min(32).max(256),
  familyName: nameSchema,
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});
export const acceptSchema = z.object({
  token: tokenSchema,
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
});
export const childSchema = z.object({ name: nameSchema, color: colorSchema });
