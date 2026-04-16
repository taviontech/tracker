import { useLocale } from 'next-intl';

/**
 * Returns a function that prepends the current locale prefix to a path.
 * English has no prefix (localePrefix: 'as-needed'), RU/UK get /<locale>.
 *
 * Usage:
 *   const lp = useLocalePath();
 *   router.push(lp('/dashboard'));  // → '/dashboard' or '/ru/dashboard'
 */
export function useLocalePath() {
  const locale = useLocale();
  return (path: string): string => {
    if (locale === 'en') return path;
    if (path === '/') return `/${locale}`;
    return `/${locale}${path}`;
  };
}
