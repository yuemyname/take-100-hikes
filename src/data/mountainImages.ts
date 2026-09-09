import type { ImageProps } from 'expo-image';

import { FOREST_SERVICE_MOUNTAIN_IMAGES } from './forestServiceMountainImages.generated';
import { MOUNTAIN_IMAGES } from './mountainImages.generated';
import { OPEN_LICENSE_MOUNTAIN_IMAGES } from './openLicenseMountainImages.generated';
import { TOURAPI_MOUNTAIN_IMAGES } from './tourApiMountainImages.generated';

export interface MountainImageCredit {
  source: ImageProps['source'];
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  articleUrl: string;
  provider: 'Wikimedia Commons' | '한국관광공사 TourAPI' | '산림청 100대 명산' | '공공저작물';
}

type StoredMountainImageCredit = Omit<MountainImageCredit, 'provider'>;

const wikimediaImageMap = MOUNTAIN_IMAGES as Record<string, StoredMountainImageCredit>;
const tourApiImageMap = TOURAPI_MOUNTAIN_IMAGES as Record<string, StoredMountainImageCredit>;
const forestServiceImageMap = FOREST_SERVICE_MOUNTAIN_IMAGES as Record<string, StoredMountainImageCredit>;
const openLicenseImageMap = OPEN_LICENSE_MOUNTAIN_IMAGES as Record<string, StoredMountainImageCredit>;

/** A bundled, license-audited mountain photo. Certification photos still take priority. */
export function getMountainImage(slug: string): MountainImageCredit | undefined {
  const tourApiImage = tourApiImageMap[slug];
  if (tourApiImage) return { ...tourApiImage, provider: '한국관광공사 TourAPI' };

  const wikimediaImage = wikimediaImageMap[slug];
  if (wikimediaImage) return { ...wikimediaImage, provider: 'Wikimedia Commons' };

  const forestServiceImage = forestServiceImageMap[slug];
  if (forestServiceImage) return { ...forestServiceImage, provider: '산림청 100대 명산' };

  const openLicenseImage = openLicenseImageMap[slug];
  if (openLicenseImage) return { ...openLicenseImage, provider: '공공저작물' };

  return undefined;
}
