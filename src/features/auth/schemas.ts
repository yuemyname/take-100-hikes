import { z } from 'zod';

export const emailSchema = z.email({ message: '이메일 형식을 확인해주세요.' });
export const passwordSchema = z.string().min(8, { message: '비밀번호는 8자 이상이어야 해요.' });
export const usernameSchema = z
  .string()
  .regex(/^[a-z0-9_]{3,20}$/, { message: '영문 소문자, 숫자, 밑줄 3~20자로 만들어주세요.' });

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
  displayName: z.string().trim().max(20, { message: '이름은 20자 이하로 적어주세요.' }).optional(),
});

export type SignInForm = z.infer<typeof signInSchema>;
export type SignUpForm = z.infer<typeof signUpSchema>;

/** First error message per field, for inline form display. */
export function fieldErrors<T extends z.ZodType>(result: z.ZodSafeParseResult<z.output<T>>): Record<string, string> {
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
