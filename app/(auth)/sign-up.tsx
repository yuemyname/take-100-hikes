import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { AppText, PrimaryButton, Screen, TextField, TopBar } from '@/components/ui';
import { colors, spacing } from '@/constants';
import { fieldErrors, signUpSchema, useAuth } from '@/features/auth';
import { authErrorMessage } from '@/features/auth/messages';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async () => {
    const result = signUpSchema.safeParse({
      email: email.trim(),
      password,
      username: username.trim().toLowerCase(),
      displayName: displayName.trim() || undefined,
    });
    const nextErrors = fieldErrors(result);
    setErrors(nextErrors);
    if (!result.success) return;

    setSubmitting(true);
    try {
      const { needsEmailConfirmation } = await signUp(result.data);
      if (needsEmailConfirmation) setConfirmationSent(true);
      // Otherwise the auth listener flips status to signedIn and the tabs appear.
    } catch (error) {
      setErrors({ form: authErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmationSent) {
    return (
      <Screen>
        <TopBar title="가입 완료" onBack={() => router.back()} />
        <View style={styles.confirmBox}>
          <AppText variant="heading2">메일함을 확인해주세요</AppText>
          <AppText variant="body" color="inkMuted" style={styles.confirmBody}>
            {email.trim()}로 인증 메일을 보냈어요. 링크를 누르면 바로 시작할 수 있어요.
          </AppText>
        </View>
        <PrimaryButton label="로그인으로 돌아가기" tone="black" onPress={() => router.replace('/sign-in')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="가입하기" onBack={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <AppText variant="heading1" style={styles.title}>
          같이 오르니까{'\n'}더 재밌잖아?
        </AppText>

        <TextField
          label="아이디"
          value={username}
          onChangeText={setUsername}
          placeholder="영문 소문자, 숫자, 밑줄 3~20자"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          error={errors.username}
        />
        <TextField
          label="이름 (선택)"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="친구에게 보일 이름"
          autoComplete="name"
          error={errors.displayName}
        />
        <TextField
          label="이메일"
          value={email}
          onChangeText={setEmail}
          placeholder="hello@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          error={errors.email}
        />
        <TextField
          label="비밀번호"
          value={password}
          onChangeText={setPassword}
          placeholder="8자 이상"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          error={errors.password}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />
        {errors.form ? (
          <AppText variant="bodySmall" color="danger" style={styles.formError}>
            {errors.form}
          </AppText>
        ) : null}
        <PrimaryButton label="가입하고 시작하기" tone="yellow" onPress={handleSubmit} loading={submitting} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.md, marginBottom: spacing.xxl },
  formError: { marginBottom: spacing.md },
  confirmBox: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.xl,
    marginVertical: spacing.xxl,
  },
  confirmBody: { marginTop: spacing.sm },
});
