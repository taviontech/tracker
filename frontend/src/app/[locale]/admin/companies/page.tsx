'use client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { adminApi } from '../../../../lib/api';

export default function AdminCompaniesPage() {
  const t = useTranslations('admin');
  const { data: companies, isLoading } = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: () => adminApi.getCompanies().then(r => r.data),
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">{t('companies')}</h1>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {(companies ?? []).map((c: any) => (
            <div key={c.id} className="glass-card rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-base font-bold text-cyan-300">
                {(c.name?.[0] ?? '?').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{c.name}</p>
                {c.website && <p className="text-xs text-slate-500 truncate mt-0.5">{c.website}</p>}
                <p className="text-xs text-slate-600 mt-0.5">
                  {c.members?.length ?? c.memberCount ?? 0} {t('members')} · {t('created')} {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">{t('owner')}</p>
                <p className="text-sm text-slate-300">{c.owner?.firstName} {c.owner?.lastName}</p>
                <p className="text-xs text-slate-600">{c.owner?.email}</p>
              </div>
            </div>
          ))}
          {(!companies || companies.length === 0) && (
            <div className="text-center py-16 text-slate-500">{t('noCompanies')}</div>
          )}
        </div>
      )}
    </div>
  );
}
