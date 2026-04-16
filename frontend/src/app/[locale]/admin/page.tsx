'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { adminApi } from '../../../lib/api';

export default function AdminPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const lp = (p: string) => locale === 'en' ? p : `/${locale}${p}`;

  const { data: users } = useQuery({ queryKey: ['admin', 'users'], queryFn: () => adminApi.getUsers(0, 1).then(r => r.data) });
  const { data: companies } = useQuery({ queryKey: ['admin', 'companies'], queryFn: () => adminApi.getCompanies().then(r => r.data) });

  const totalUsers = users?.totalElements ?? 0;
  const totalCompanies = (companies ?? []).length;

  const cards = [
    { label: t('totalUsers'), value: totalUsers, href: lp('/admin/users'), color: 'from-blue-500 to-blue-500' },
    { label: t('companies'), value: totalCompanies, href: lp('/admin/companies'), color: 'from-cyan-500 to-teal-500' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
      <p className="text-slate-400 mb-10">{t('systemOverview')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {cards.map(c => (
          <Link key={c.href} href={c.href} className="glass-card rounded-2xl p-6 hover:scale-[1.01] transition-transform">
            <p className="text-sm text-slate-400 mb-1">{c.label}</p>
            <p className={`text-4xl font-bold bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href={lp('/admin/users')} className="glass-card rounded-2xl p-6 flex items-center gap-4 hover:border-blue-500/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{t('manageUsers')}</p>
            <p className="text-xs text-slate-500">{t('manageUsersDesc')}</p>
          </div>
        </Link>
        <Link href={lp('/admin/companies')} className="glass-card rounded-2xl p-6 flex items-center gap-4 hover:border-cyan-500/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{t('manageCompanies')}</p>
            <p className="text-xs text-slate-500">{t('manageCompaniesDesc')}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
