/** Map Supabase auth errors to friendly Korean copy — spec §16, §21. */
export function authErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (message.includes('invalid login credentials')) return '이메일 또는 비밀번호가 맞지 않아요.';
  if (message.includes('email not confirmed')) return '이메일 인증을 먼저 완료해주세요.';
  if (message.includes('already registered') || message.includes('already exists'))
    return '이미 가입된 이메일이에요.';
  if (message.includes('username') && message.includes('unique')) return '이미 사용 중인 아이디예요.';
  if (message.includes('network') || message.includes('fetch')) return '잠깐 연결이 끊겼어요.\n다시 시도해주세요.';

  return '문제가 생겼어요. 잠시 후 다시 시도해주세요.';
}
