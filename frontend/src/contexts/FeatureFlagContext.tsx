'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getFeatureFlags, isFeatureEnabled, FeatureFlag } from '@/lib/featureFlags';

interface FeatureFlagContextType {
  flags: Map<string, boolean>;
  loading: boolean;
  checkFlag: (flagKey: string) => boolean;
  refresh: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadFlags = async () => {
    try {
      const allFlags = await getFeatureFlags();
      const flagMap = new Map<string, boolean>();

      // Check each flag for current user
      for (const flag of allFlags) {
        const enabled = await isFeatureEnabled(flag.flag_key);
        flagMap.set(flag.flag_key, enabled);
      }

      setFlags(flagMap);
    } catch (error) {
      console.error('Error loading feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const checkFlag = (flagKey: string): boolean => {
    return flags.get(flagKey) || false;
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, loading, checkFlag, refresh: loadFlags }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlag(flagKey: string): boolean {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlag must be used within FeatureFlagProvider');
  }
  return context.checkFlag(flagKey);
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagProvider');
  }
  return context;
}
