'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { authApi } from '../../../lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const qc = useQueryClient();
  const t = useTranslations('verifyEmail');
  const locale = useLocale();
  const lp = (path: string) => locale === 'en' ? path : `/${locale}${path === '/' ? '' : path}`;

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    authApi.verifyEmail(token)
      .then(() => {
        // Refresh user data so emailVerified updates everywhere instantly
        qc.invalidateQueries({ queryKey: ['auth', 'me'] });
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, [token, qc]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-blue-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-400">{t('loading')}</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('successTitle')}</h1>
          <p className="text-slate-400">{t('successDesc')}</p>
        </div>
        <Link
          href={lp('/dashboard')}
          className="px-6 py-3 btn-primary rounded-xl text-sm font-semibold flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          {t('successBtn')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">{t('errorTitle')}</h1>
        <p className="text-slate-400">{t('errorDesc')}</p>
      </div>
      <Link
        href={lp('/')}
        className="px-6 py-3 btn-ghost rounded-xl text-sm font-semibold"
      >
        {t('errorBtn')}
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-10 max-w-md w-full">
        <Suspense fallback={
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-blue-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
