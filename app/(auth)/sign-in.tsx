import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { AppText, PrimaryButton, Screen, SecondaryButton, TextField, Wordmark } from '@/components/ui';
import { colors, spacing } from '@/constants';
import { fieldErrors, signInSchema, useAuth } from '@/features/auth';
import { authErrorMessage } from '@/features/auth/messages';

const LOGIN_TITLE_LOGO = require('../../assets/brand/login-title-logo.png');

export default function SignInScreen() {
  const router = useRouter();
  const { signInWithPassword, isConfigured, continueAsGuest } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const result = signInSchema.safeParse({ email: email.trim(), password });
    const nextErrors = fieldErrors(result);
    setErrors(nextErrors);
    if (!result.success) return;

    setSubmitting(true);
    try {
      await signInWithPassword(result.data.email, result.data.password);
    } catch (error) {
      setErrors({ form: authErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.hero}>
          <Wordmark size={40} multicolor />
          <AppText variant="body" color="inkMuted">
            100개의 산, 100개의 이야기.
          </AppText>
          <Image
            source={LOGIN_TITLE_LOGO}
            contentFit="contain"
            style={styles.titleLogo}
            accessibilityLabel="대체 산을 왜 타는 건데 타이틀 로고"
          />
        </View>

        {isConfigured ? (
          <View>
            <TextField
              label="이메일"
              value={email}
              onChangeText={setEmail}
              placeholder="hello@example.com"
              autoCapitalize="none"
              autoComplete={Platform.OS === 'ios' ? undefined : 'username'}
              keyboardType="email-address"
              textContentType={Platform.OS === 'ios' ? 'username' : undefined}
              error={errors.email}
            />
            <TextField
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              placeholder="8자 이상"
              secureTextEntry
              autoComplete={Platform.OS === 'ios' ? undefined : 'current-password'}
              textContentType={Platform.OS === 'ios' ? 'password' : undefined}
              error={errors.password}
              onSubmitEditing={handleSubmit}
              returnKeyType="done"
            />
            {errors.form ? (
              <AppText variant="bodySmall" color="danger" style={styles.formError}>
                {errors.form}
              </AppText>
            ) : null}
            <PrimaryButton label="로그인" onPress={handleSubmit} loading={submitting} />
            <View style={styles.gap} />
            <SecondaryButton label="처음이라면 가입하기" onPress={() => router.push('/sign-up')} />
          </View>
        ) : (
          <View>
            <View style={styles.notice}>
              <AppText variant="heading3">Supabase 설정이 아직 없어요</AppText>
              <AppText variant="bodySmall" color="inkMuted" style={styles.noticeBody}>
                .env 파일에 EXPO_PUBLIC_SUPABASE_URL과 EXPO_PUBLIC_SUPABASE_ANON_KEY를 넣고 앱을 다시 시작하면 로그인할 수 있어요.
              </AppText>
            </View>
            {__DEV__ ? <SecondaryButton label="설정 없이 둘러보기" onPress={continueAsGuest} /> : null}
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xxxl },
  hero: { marginBottom: spacing.xxxl },
  titleLogo: { width: '100%', maxWidth: 340, aspectRatio: 1280 / 830, alignSelf: 'center', marginTop: spacing.xl },
  formError: { marginBottom: spacing.md },
  gap: { height: spacing.md },
  notice: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  noticeBody: { marginTop: spacing.sm },
});
