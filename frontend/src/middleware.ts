import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'ru', 'uk'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  localeDetection: false, // rely on URL only, no cookie override
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
