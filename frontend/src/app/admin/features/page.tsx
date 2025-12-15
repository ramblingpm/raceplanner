'use client';

import { useState, useEffect } from 'react';
import {
  getFeatureFlags,
  toggleFeatureFlag,
  FeatureFlag as FeatureFlagType
} from '@/lib/featureFlags';

export default function FeatureFlagsAdminPage() {
  const [flags, setFlags] = useState<FeatureFlagType[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      const data = await getFeatureFlags();
      setFlags(data);
    } catch (error) {
      console.error('Error loading flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (flagKey: string, currentValue: boolean) => {
    setToggling(flagKey);
    try {
      await toggleFeatureFlag(flagKey, !currentValue);
      await loadFlags();
    } catch (error) {
      console.error('Error toggling flag:', error);
      alert('Failed to toggle feature flag. Please try again.');
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface-background rounded-lg shadow-sm p-6 border border-border">
        <div className="text-center text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Feature Flags</h2>
        <p className="mt-1 text-sm text-text-muted">
          Enable or disable features in production
        </p>
      </div>

      <div className="bg-surface-background rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-1">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden sm:table-cell">
                  Key
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden lg:table-cell">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface-background divide-y divide-border">
              {flags.map((flag) => (
                <tr key={flag.id} className="hover:bg-surface-1 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-text-primary">{flag.name}</div>
                    <div className="text-xs text-text-muted sm:hidden font-mono mt-1">{flag.flag_key}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="text-xs text-text-secondary font-mono bg-surface-2 px-2 py-1 rounded inline-block">
                      {flag.flag_key}
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <div className="text-sm text-text-secondary max-w-xs truncate">
                      {flag.description || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      flag.enabled
                        ? 'bg-success-subtle text-success-foreground'
                        : 'bg-surface-3 text-text-secondary'
                    }`}>
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleToggle(flag.flag_key, flag.enabled)}
                      disabled={toggling === flag.flag_key}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                        flag.enabled
                          ? 'bg-error text-white hover:bg-error-hover'
                          : 'bg-primary text-white hover:bg-primary-hover'
                      }`}
                    >
                      {toggling === flag.flag_key ? 'Updating...' : flag.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {flags.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            No feature flags found
          </div>
        )}
      </div>

      <div className="bg-info-subtle border border-info rounded-lg p-4">
        <h3 className="text-sm font-semibold text-info-foreground mb-2">How Feature Flags Work</h3>
        <ul className="text-sm text-info-foreground space-y-1 list-disc list-inside">
          <li>Deploy features wrapped in feature flags (disabled by default)</li>
          <li>Enable flags here to activate features in production</li>
          <li>Instantly disable if issues occur (no deployment needed)</li>
          <li>Test safely before full rollout</li>
        </ul>
      </div>
    </div>
  );
}
