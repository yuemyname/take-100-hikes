import { z } from 'zod';

import type { CreateManualActivityInput } from './types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year = Number.NaN, month = Number.NaN, day = Number.NaN] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

const positiveNumber = (label: string, min: number, max: number) =>
  z.string().trim().min(1, `${label}을 입력해주세요.`).transform(Number).pipe(
    z.number().finite(`${label}을 숫자로 입력해주세요.`).min(min, `${label}이 너무 작아요.`).max(max, `${label}이 너무 커요.`),
  );

export const manualActivityFormSchema = z.object({
  mountainId: z.string().nullable(),
  date: z.string().trim().refine(isCalendarDate, '날짜를 YYYY-MM-DD 형식으로 입력해주세요.'),
  startTime: z.string().trim().regex(TIME_PATTERN, '시작 시각을 HH:MM 형식으로 입력해주세요.'),
  durationMinutes: positiveNumber('운동 시간', 1, 2880),
  distanceKm: positiveNumber('이동 거리', 0.1, 200),
  elevationGainM: z.string().trim().transform((value) => (value === '' ? null : Number(value))).pipe(
    z.number().finite('상승 고도를 숫자로 입력해주세요.').min(0, '상승 고도는 0 이상이어야 해요.').max(15000, '상승 고도가 너무 커요.').nullable(),
  ),
  note: z.string().trim().max(500, '메모는 500자 이하로 입력해주세요.'),
  visibility: z.enum(['private', 'friends', 'public']),
});

export type ManualActivityForm = z.infer<typeof manualActivityFormSchema>;

export function buildManualActivityInput(form: ManualActivityForm): CreateManualActivityInput {
  const started = new Date(`${form.date}T${form.startTime}:00`);
  const movingSeconds = Math.round(form.durationMinutes * 60);
  return {
    mountainId: form.mountainId,
    startedAt: started.toISOString(),
    endedAt: new Date(started.getTime() + movingSeconds * 1000).toISOString(),
    movingSeconds,
    distanceM: Math.round(form.distanceKm * 1000),
    elevationGainM: form.elevationGainM === null ? null : Math.round(form.elevationGainM),
    note: form.note || null,
    visibility: form.visibility,
  };
}
