/** Map Supabase auth errors to friendly Korean copy — spec §16, §21. */
export function authErrorMessage(error: unknown): string {
  const authError = error as { code?: unknown; message?: unknown } | null;
  const code = typeof authError?.code === 'string' ? authError.code.toLowerCase() : '';
  const message =
    typeof authError?.message === 'string'
      ? authError.message.toLowerCase()
      : error instanceof Error
        ? error.message.toLowerCase()
        : '';

  if (code === 'invalid_credentials') return '이메일 또는 비밀번호가 맞지 않아요.';
  if (code === 'email_not_confirmed') return '이메일 인증을 먼저 완료해주세요.';
  if (code === 'email_exists' || code === 'user_already_exists') return '이미 가입된 이메일이에요.';
  if (code === 'over_email_send_rate_limit')
    return '인증 메일 발송 한도를 초과했어요. 잠시 후 다시 시도해주세요.';
  if (code === 'over_request_rate_limit') return '가입 요청이 너무 많아요. 몇 분 후 다시 시도해주세요.';
  if (code === 'email_address_not_authorized')
    return '현재 메일 설정에서는 이 주소로 인증 메일을 보낼 수 없어요.';
  if (code === 'weak_password') return '더 안전한 비밀번호를 사용해주세요.';
  if (code === 'signup_disabled' || code === 'email_provider_disabled') return '현재 이메일 가입이 비활성화되어 있어요.';
  if (code === 'unexpected_failure') return '가입 정보를 저장하지 못했어요. 잠시 후 다시 시도해주세요.';

  if (message.includes('invalid login credentials')) return '이메일 또는 비밀번호가 맞지 않아요.';
  if (message.includes('email not confirmed')) return '이메일 인증을 먼저 완료해주세요.';
  if (
    message.includes('already registered') ||
    message.includes('already been registered') ||
    message.includes('already exists')
  )
    return '이미 가입된 이메일이에요.';
  if (message.includes('rate limit') && message.includes('email'))
    return '인증 메일 발송 한도를 초과했어요. 잠시 후 다시 시도해주세요.';
  if (message.includes('too many requests')) return '가입 요청이 너무 많아요. 몇 분 후 다시 시도해주세요.';
  if (message.includes('username') && message.includes('unique')) return '이미 사용 중인 아이디예요.';
  if (message.includes('network') || message.includes('fetch')) return '잠깐 연결이 끊겼어요.\n다시 시도해주세요.';

  return '문제가 생겼어요. 잠시 후 다시 시도해주세요.';
}
