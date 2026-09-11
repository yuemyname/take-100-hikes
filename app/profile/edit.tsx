import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import {
  AppText,
  Avatar,
  EmptyState,
  LoadingSkeleton,
  PrimaryButton,
  Screen,
  SecondaryButton,
  TextField,
  TopBar,
} from '@/components/ui';
import { colors, radii, spacing } from '@/constants';
import { useAuth } from '@/features/auth';
import { fieldErrors } from '@/features/auth/schemas';
import { authErrorMessage } from '@/features/auth/messages';
import {
  profileUpdateSchema,
  useProfile,
  useUpdateProfile,
  useViewerId,
  type ProfileMediaSelection,
} from '@/features/social';
import type { Profile } from '@/types';

type MediaChange = ProfileMediaSelection | null | undefined;

const DEFAULT_HOME_BACKGROUND = require('../../assets/photos/home-hero.png');

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const viewerId = useViewerId();
  const profile = useProfile(viewerId);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  if (profile.isLoading) {
    return (
      <Screen>
        <TopBar title="프로필 수정" onBack={goBack} />
        <LoadingSkeleton height={120} radius={radii.cardLarge} />
        <View style={styles.gap} />
        <LoadingSkeleton lines={4} height={52} radius={radii.card} />
      </Screen>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <Screen>
        <TopBar title="프로필 수정" onBack={goBack} />
        <EmptyState
          title="프로필을 불러오지 못했어요"
          description="연결 상태를 확인하고 다시 시도해주세요."
          actionLabel="다시 시도"
          onAction={() => profile.refetch()}
        />
      </Screen>
    );
  }

  return <ProfileEditor key={profile.data.id} profile={profile.data} email={user?.email} onBack={goBack} />;
}

function ProfileEditor({ profile, email, onBack }: { profile: Profile; email?: string; onBack: () => void }) {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const update = useUpdateProfile();
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.display_name ?? profile.username);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatar, setAvatar] = useState<MediaChange>(undefined);
  const [homeBackground, setHomeBackground] = useState<MediaChange>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pickerError, setPickerError] = useState<string | null>(null);

  const pickImage = async (kind: 'avatar' | 'homeBackground') => {
    setPickerError(null);
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setPickerError('사진을 선택하려면 사진 보관함 접근을 허용해주세요.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: kind === 'avatar' ? [1, 1] : [9, 16],
        quality: 0.85,
      });
      if (result.canceled) return;
      const selected = result.assets[0];
      if (!selected) return;
      const change = { uri: selected.uri, mimeType: selected.mimeType ?? null };
      if (kind === 'avatar') setAvatar(change);
      else setHomeBackground(change);
    } catch {
      setPickerError('사진을 불러오지 못했어요. 다시 선택해주세요.');
    }
  };

  const handleSave = () => {
    const values = { username: username.trim().toLowerCase(), displayName: displayName.trim(), bio: bio.trim() };
    const result = profileUpdateSchema.safeParse(values);
    if (!result.success) {
      setErrors(fieldErrors(result));
      return;
    }
    setErrors({});
    setPickerError(null);
    update.mutate(
      { ...result.data, avatar, homeBackground },
      { onSuccess: onBack },
    );
  };

  const avatarUri = avatar === undefined ? profile.avatar_url : avatar?.uri ?? null;
  const backgroundUri = homeBackground === undefined ? profile.home_background_url : homeBackground?.uri ?? null;
  const formError = update.isError ? authErrorMessage(update.error) : null;
  const homeHeroAspectRatio = windowWidth / Math.max(620, windowHeight - 64);

  return (
    <Screen>
      <TopBar title="프로필 수정" onBack={onBack} />

      <View style={styles.avatarSection}>
        <Avatar uri={avatarUri} name={displayName || username} size="xl" />
        <View style={styles.mediaButtons}>
          <SecondaryButton label="프로필 사진 선택" fullWidth={false} onPress={() => pickImage('avatar')} />
          {avatarUri ? (
            <SecondaryButton label="사진 삭제" fullWidth={false} onPress={() => setAvatar(null)} />
          ) : null}
        </View>
      </View>

      <TextField
        label="사용자 아이디"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
        placeholder="영문 소문자, 숫자, 밑줄"
        error={errors.username}
      />
      <AppText variant="caption" color="inkMuted" style={styles.usernameHint}>
        친구 검색과 @아이디 표시에 사용해요. 로그인은 이메일로 합니다.
      </AppText>
      <TextField
        label="이름"
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={20}
        placeholder="앱에서 보여줄 이름"
        error={errors.displayName}
      />
      <TextField
        label="한 줄 소개"
        value={bio}
        onChangeText={setBio}
        maxLength={120}
        multiline
        numberOfLines={3}
        placeholder="어떤 산을 좋아하는지 알려주세요"
        error={errors.bio}
        style={styles.bioInput}
      />
      {email ? (
        <AppText variant="caption" color="inkMuted" style={styles.email}>
          로그인 이메일 · {email}
        </AppText>
      ) : null}

      <View style={styles.backgroundSection}>
        <View>
          <AppText variant="heading3">홈 산 배경</AppText>
          <AppText variant="caption" color="inkMuted">홈의 캐릭터와 메뉴 뒤에 보이는 사진이에요.</AppText>
        </View>
        <View
          style={[styles.backgroundPreview, { aspectRatio: homeHeroAspectRatio }]}
          accessibilityRole="image"
          accessibilityLabel="홈 산 배경 적용 미리보기"
        >
          <Image
            source={backgroundUri ? { uri: backgroundUri } : DEFAULT_HOME_BACKGROUND}
            contentFit="cover"
            contentPosition="center"
            style={StyleSheet.absoluteFill}
          />
        </View>
        <AppText variant="caption" color="inkMuted" align="center">
          현재 기기의 홈 화면과 같은 비율로 보여드려요.
        </AppText>
        <View style={styles.mediaButtons}>
          <SecondaryButton label="배경 사진 선택" fullWidth={false} onPress={() => pickImage('homeBackground')} />
          {backgroundUri ? (
            <SecondaryButton label="기본 배경 사용" fullWidth={false} onPress={() => setHomeBackground(null)} />
          ) : null}
        </View>
      </View>

      {pickerError || formError ? (
        <AppText variant="bodySmall" color="danger" style={styles.error}>
          {pickerError ?? formError}
        </AppText>
      ) : null}

      <View style={styles.save}>
        <PrimaryButton label="변경사항 저장" onPress={handleSave} loading={update.isPending} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { height: spacing.md },
  avatarSection: { alignItems: 'center', gap: spacing.md, marginVertical: spacing.xl },
  mediaButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  bioInput: { minHeight: 96, paddingTop: spacing.md, textAlignVertical: 'top' },
  usernameHint: { marginTop: -spacing.sm },
  email: { marginTop: -spacing.sm },
  backgroundSection: {
    marginTop: spacing.xxl,
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.cardLarge,
  },
  backgroundPreview: {
    width: '72%',
    alignSelf: 'center',
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: colors.ink,
  },
  error: { marginTop: spacing.lg },
  save: { marginTop: spacing.xxl },
});
