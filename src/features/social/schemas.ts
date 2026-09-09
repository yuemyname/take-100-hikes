import { z } from 'zod';

import { usernameSchema } from '@/features/auth/schemas';

export const profileUpdateSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(1, { message: '이름을 입력해주세요.' }).max(20, { message: '이름은 20자 이하로 적어주세요.' }),
  bio: z.string().trim().max(120, { message: '소개는 120자 이하로 적어주세요.' }),
});

export type ProfileUpdateForm = z.infer<typeof profileUpdateSchema>;
