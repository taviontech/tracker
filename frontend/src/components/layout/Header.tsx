'use client';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth, useLogout } from '../../lib/hooks/useAuth';
import { useAuthModal } from '../../context/AuthModalContext';
import { useLocalePath } from '../../lib/hooks/useLocalePath';
import { useTheme } from '../../context/ThemeContext';

export default function Header() {
  const t = useTranslations('nav');
  const { data: auth } = useAuth();
  const { mutate: logout } = useLogout();
  const { openLogin, openRegister } = useAuthModal();
  const pathname = usePathname();
  const lp = useLocalePath();
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const user = auth?.user;
  const role = auth?.memberships?.[0]?.role;

  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0f1e]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">

          <Link href={lp('/')} className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <rect x="1" y="2" width="5" height="9" rx="1"/>
                <rect x="7.5" y="2" width="5" height="13" rx="1"/>
                <rect x="14" y="2" width="5" height="6" rx="1"/>
              </svg>
            </div>
            <span className="text-white font-bold text-base tracking-tight">
              Tracker<span className="gradient-text">Hub</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            <NavLink href={lp('/about')} pathname={pathname}>{t('about')}</NavLink>
            <NavLink href={lp('/donate')} pathname={pathname}>{t('donate')}</NavLink>
            {user && (
              <>
                <div className="h-4 w-px bg-white/10 mx-1" />
                {(role === 'OWNER' || role === 'CO_OWNER' || role === 'MANAGER' || role === 'DEVELOPER') && (
                  <NavLink href={lp('/dashboard')} pathname={pathname}>{t('dashboard')}</NavLink>
                )}
                {(role === 'OWNER' || role === 'CO_OWNER') && (
                  <NavLink href={lp('/plans')} pathname={pathname}>{t('plans')}</NavLink>
                )}
                {user?.systemRole === 'ADMIN' && (
                  <NavLink href={lp('/admin')} pathname={pathname}>{t('admin')}</NavLink>
                )}
                <NavLink href={lp('/profile')} pathname={pathname}>{t('profile')}</NavLink>
              </>
            )}
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            <button
              onClick={toggle}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {user ? (
              <>
                <div className="flex items-center gap-2 px-2">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt="avatar" className="w-7 h-7 rounded-full object-cover border border-white/20" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-500/30 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-300">
                      {((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')).toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="text-xs text-slate-500">{user.email}</span>
                </div>
                <div className="h-4 w-px bg-white/10 mx-1" />
                <button
                  onClick={() => logout()}
                  className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-200 transition-colors rounded-lg hover:bg-white/5"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={openLogin}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all duration-200"
                >
                  {t('login')}
                </button>
                <button
                  onClick={openRegister}
                  className="px-4 py-2 text-sm font-semibold btn-primary rounded-lg"
                >
                  {t('register')}
                </button>
              </>
            )}
            <LocaleSwitcher pathname={pathname} />
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden ml-auto p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
      )}

      <div className={`md:hidden fixed top-16 inset-x-0 z-40 bg-[#0a0f1e]/95 backdrop-blur-xl border-b border-white/[0.06] transition-all duration-300 ease-in-out ${
        menuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}>
        <nav className="flex flex-col px-4 py-4 gap-1">
          <MobileNavLink href={lp('/about')} pathname={pathname} onClick={() => setMenuOpen(false)}>{t('about')}</MobileNavLink>
          <MobileNavLink href={lp('/donate')} pathname={pathname} onClick={() => setMenuOpen(false)}>{t('donate')}</MobileNavLink>
          {user && (
            <>
              <div className="h-px bg-white/[0.07] my-2" />
              {(role === 'OWNER' || role === 'CO_OWNER' || role === 'MANAGER' || role === 'DEVELOPER') && (
                <MobileNavLink href={lp('/dashboard')} pathname={pathname} onClick={() => setMenuOpen(false)}>{t('dashboard')}</MobileNavLink>
              )}
              {(role === 'OWNER' || role === 'CO_OWNER') && (
                <MobileNavLink href={lp('/plans')} pathname={pathname} onClick={() => setMenuOpen(false)}>{t('plans')}</MobileNavLink>
              )}
              {user?.systemRole === 'ADMIN' && (
                <MobileNavLink href={lp('/admin')} pathname={pathname} onClick={() => setMenuOpen(false)}>{t('admin')}</MobileNavLink>
              )}
              <MobileNavLink href={lp('/profile')} pathname={pathname} onClick={() => setMenuOpen(false)}>{t('profile')}</MobileNavLink>
            </>
          )}
          <div className="h-px bg-white/[0.07] my-2" />
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all duration-200"
          >
            {theme === 'dark' ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
                Light mode
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                Dark mode
              </>
            )}
          </button>
          {user ? (
            <button
              onClick={() => { logout(); setMenuOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all duration-200"
            >
              {t('logout')}
            </button>
          ) : (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { openLogin(); setMenuOpen(false); }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white rounded-xl border border-white/[0.08] hover:bg-white/[0.06] transition-all duration-200"
              >
                {t('login')}
              </button>
              <button
                onClick={() => { openRegister(); setMenuOpen(false); }}
                className="flex-1 px-4 py-2.5 text-sm font-semibold btn-primary rounded-xl"
              >
                {t('register')}
              </button>
            </div>
          )}
          <div className="pt-3 pb-1">
            <LocaleSwitcher pathname={pathname} />
          </div>
        </nav>
      </div>
    </>
  );
}

function NavLink({ href, pathname, children }: { href: string; pathname: string; children: ReactNode }) {
  const isActive = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link href={href} className={`relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
      isActive ? 'text-white bg-white/[0.07]' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
    }`}>
      {children}
      <span className={`absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ${
        isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-40 group-hover:scale-x-100'
      }`} />
    </Link>
  );
}

function MobileNavLink({ href, pathname, onClick, children }: { href: string; pathname: string; onClick: () => void; children: ReactNode }) {
  const isActive = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link href={href} onClick={onClick} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
      isActive ? 'text-white bg-white/[0.08] border border-white/[0.08]' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
    }`}>
      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 shrink-0" />}
      {children}
    </Link>
  );
}

function LocaleSwitcher({ pathname }: { pathname: string }) {
  const currentLocale = pathname.startsWith('/ru') ? 'ru' : pathname.startsWith('/uk') ? 'uk' : 'en';
  const cleanPath = pathname.replace(/^\/(ru|uk)/, '') || '/';
  const localeHref = (locale: 'en' | 'ru' | 'uk') => locale === 'en' ? cleanPath : `/${locale}${cleanPath}`;
  const labels: Record<string, string> = { en: 'EN', ru: 'RU', uk: 'UA' };
  return (
    <div className="flex items-center gap-0.5 bg-white/[0.05] border border-white/[0.08] rounded-lg p-0.5 w-fit">
      {(['en', 'ru', 'uk'] as const).map((l) => (
        <a key={l} href={localeHref(l)} className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md transition-all duration-200 ${
          currentLocale === l ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
        }`}>
          {labels[l]}
        </a>
      ))}
    </div>
  );
}
