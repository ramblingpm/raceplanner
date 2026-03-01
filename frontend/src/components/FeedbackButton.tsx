'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FeedbackModal } from './FeedbackModal';
import { useAuth } from './AuthProvider';

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const t = useTranslations('feedback');

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg hover:bg-primary-hover text-sm transition-colors z-40"
        aria-label={t('button')}
      >
        {t('button')}
      </button>

      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
