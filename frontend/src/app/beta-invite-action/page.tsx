'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

function ActionResultContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const error = searchParams.get('error');
  const email = searchParams.get('email');
  const message = searchParams.get('message');

  const getIcon = () => {
    if (status === 'approved') {
      return (
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (status === 'denied') {
      return (
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
          <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    }
  };

  const getTitle = () => {
    if (status === 'approved') {
      return 'Beta Invite Approved!';
    } else if (status === 'denied') {
      return 'Beta Invite Denied';
    } else if (error === 'already_approved') {
      return 'Already Approved';
    } else if (error === 'invalid_or_expired_token') {
      return 'Link Expired';
    } else if (error === 'missing_token') {
      return 'Invalid Link';
    } else {
      return 'Something Went Wrong';
    }
  };

  const getMessage = () => {
    if (status === 'approved') {
      return (
        <>
          <p className="text-gray-700 mb-2">
            The beta invite for <strong>{email}</strong> has been approved successfully.
          </p>
          <p className="text-gray-700">
            The user will now be able to sign up and access the application.
          </p>
        </>
      );
    } else if (status === 'denied') {
      return (
        <>
          <p className="text-gray-700 mb-2">
            The beta invite for <strong>{email}</strong> has been denied and removed from the system.
          </p>
        </>
      );
    } else if (error === 'already_approved') {
      return (
        <>
          <p className="text-gray-700 mb-2">
            The beta invite for <strong>{email}</strong> has already been approved.
          </p>
          <p className="text-gray-700">
            No further action is needed.
          </p>
        </>
      );
    } else if (error === 'invalid_or_expired_token') {
      return (
        <>
          <p className="text-gray-700 mb-2">
            This action link is invalid or has expired.
          </p>
          <p className="text-gray-700">
            Action links expire after 72 hours. Please use the admin panel to manage beta invites.
          </p>
        </>
      );
    } else if (error === 'missing_token') {
      return (
        <>
          <p className="text-gray-700 mb-2">
            This link is missing required information.
          </p>
        </>
      );
    } else if (message) {
      return (
        <>
          <p className="text-gray-700 mb-2">{message}</p>
        </>
      );
    } else {
      return (
        <>
          <p className="text-gray-700 mb-2">
            An unexpected error occurred while processing your request.
          </p>
          <p className="text-gray-700">
            Please try again or contact support if the problem persists.
          </p>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-6">
            {getIcon()}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{getTitle()}</h2>
            <div className="text-left">{getMessage()}</div>
          </div>

          <div className="space-y-3">
            <Link
              href="/admin/beta-invites"
              className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Admin Panel
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-100 text-gray-700 text-center py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BetaInviteActionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <ActionResultContent />
    </Suspense>
  );
}
