'use client';

import Link from 'next/link';
import { trackButtonClick, trackNavigation } from '@/lib/analytics';
import { ComponentProps } from 'react';

interface TrackedLinkProps extends ComponentProps<typeof Link> {
  eventName: string;
  eventLocation: string;
  eventData?: Record<string, any>;
}

/**
 * TrackedLink - A Link component with built-in analytics tracking
 * Automatically tracks clicks and navigation events
 */
export default function TrackedLink({
  eventName,
  eventLocation,
  eventData,
  href,
  onClick,
  children,
  ...props
}: TrackedLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Track the button click
    trackButtonClick(eventName, eventLocation, eventData);

    // Track navigation
    trackNavigation(href.toString(), eventLocation);

    // Call original onClick if provided
    onClick?.(e);
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
