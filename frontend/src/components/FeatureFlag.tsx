'use client';

import { ReactNode } from 'react';
import { useFeatureFlag } from '@/contexts/FeatureFlagContext';

interface FeatureFlagProps {
  flag: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function FeatureFlag({ flag, children, fallback = null }: FeatureFlagProps) {
  const isEnabled = useFeatureFlag(flag);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
