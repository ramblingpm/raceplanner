import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, locales, Locale } from './i18n/config';

/**
 * Detect locale from Accept-Language header
 */
function getLocaleFromHeader(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get('accept-language');

  if (!acceptLanguage) return defaultLocale;

  // Parse Accept-Language header (e.g., "sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7")
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, qValue] = lang.trim().split(';q=');
      const langCode = code.split('-')[0].toLowerCase(); // Extract base language (sv from sv-SE)
      const quality = qValue ? parseFloat(qValue) : 1.0;
      return { langCode, quality };
    })
    .sort((a, b) => b.quality - a.quality); // Sort by quality score

  // Find first matching locale
  for (const { langCode } of languages) {
    if (locales.includes(langCode as Locale)) {
      return langCode as Locale;
    }
  }

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;

  let locale: string;
  let shouldSetCookie = false;

  if (cookieLocale && locales.includes(cookieLocale as any)) {
    // User has explicitly set a language preference - respect it
    locale = cookieLocale;
  } else {
    // No preference set - detect from browser
    locale = getLocaleFromHeader(request);
    shouldSetCookie = true;
  }

  // Validate locale
  const validLocale = locales.includes(locale as any) ? locale : defaultLocale;

  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', validLocale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set cookie if we auto-detected the language
  if (shouldSetCookie) {
    response.cookies.set('NEXT_LOCALE', validLocale, {
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'strict',
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc.)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
