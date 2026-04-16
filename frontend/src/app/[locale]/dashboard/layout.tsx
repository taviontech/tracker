'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '../../../lib/hooks/useAuth';

const BOARDS_ICON = 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2';

const NAV_KEYS = [
  { key: 'overview', tKey: 'overview', path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { key: 'team', tKey: 'team', path: '/dashboard/team', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'backlog', tKey: 'backlog', path: '/dashboard/backlog', icon: 'M4 6h16M4 10h16M4 14h10M4 18h7' },
  { key: 'boards', tKey: 'board', path: '/dashboard/boards', icon: BOARDS_ICON },
  { key: 'tickets', tKey: 'tickets', path: '/dashboard/tickets', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('dashboard');
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
  const { data: auth, isSuccess, isLoading } = useAuth();
  const lp = (p: string) => locale === 'en' ? p : `/${locale}${p}`;

  useEffect(() => {
    if (isSuccess && !auth?.memberships?.[0]) {
      router.replace(lp('/'));
    }
  }, [isSuccess]);

  if (isLoading || !isSuccess) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="relative">
          <div className="w-10 h-10 border-2 border-blue-500/30 rounded-full" />
          <div className="absolute inset-0 w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/[0.06] pt-8 pb-6 px-3 hidden md:flex flex-col">
        {/* Company info */}
        <div className="mb-6 px-3">
          <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest mb-2">{t('title')}</p>
          {auth?.memberships?.[0]?.companyName && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500/30 to-blue-600/30 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-300 shrink-0">
                {auth.memberships[0].companyName[0]?.toUpperCase()}
              </div>
              <p className="text-sm text-slate-300 font-medium truncate">{auth.memberships[0].companyName}</p>
            </div>
          )}
        </div>

        <nav className="space-y-0.5 flex-1">
          {NAV_KEYS.map(item => {
            const isBoards = item.key === 'boards';
            const basePath = item.path;
            const href = lp(basePath);
            const isActive = isBoards
              ? pathname.startsWith(lp('/dashboard/boards'))
              : item.path === '/dashboard'
              ? pathname === lp('/dashboard') || pathname === lp('/dashboard') + '/'
              : pathname.startsWith(lp(basePath));
            return (
              <Link
                key={item.key}
                href={href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-r-full" />
                )}
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {t(item.tKey as any)}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user info */}
        {auth?.user && (
          <div className="mt-4 pt-4 border-t border-white/[0.06] px-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/40 to-blue-600/40 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300 shrink-0">
                {auth.user.email?.[0]?.toUpperCase()}
              </div>
              <p className="text-xs text-slate-500 truncate">{auth.user.email}</p>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden w-full absolute">
        <div className="flex gap-1 px-4 pt-2 overflow-x-auto border-b border-white/[0.06] pb-2">
          {NAV_KEYS.map(item => {
            const isBoards = item.key === 'boards';
            const basePath = item.path;
            const href = lp(basePath);
            const isActive = isBoards
              ? pathname.startsWith(lp('/dashboard/boards'))
              : item.path === '/dashboard'
              ? pathname === lp('/dashboard')
              : pathname.startsWith(lp(basePath));
            return (
              <Link key={item.key} href={href} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20' : 'text-slate-500 hover:text-slate-300'
              }`}>
                {t(item.tKey as any)}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
