'use client';

import { useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export default function Modal({ isOpen, onClose, title, children, size = 'lg' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
    full: 'sm:max-w-7xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal - full width sheet on mobile, centered card on desktop */}
        <div
          ref={modalRef}
          className={`relative bg-surface-background w-full ${sizeClasses[size]} max-h-[95vh] sm:max-h-[90vh] flex flex-col border-t sm:border border-border rounded-t-2xl sm:rounded-lg shadow-xl`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
            <h2 className="text-lg sm:text-2xl font-bold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-secondary transition-colors rounded-lg hover:bg-surface-1"
              aria-label="Close modal"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
