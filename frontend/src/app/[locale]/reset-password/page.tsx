'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations, useLocale } from 'next-intl';
import { useResetPassword, useValidateResetToken } from '../../../lib/hooks/useAuth';

const schema = z.object({
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const t = useTranslations('resetPassword');
  const locale = useLocale();
  const lp = (path: string) => locale === 'en' ? path : `/${locale}${path === '/' ? '' : path}`;

  const { mutate: resetPassword, isPending, isSuccess, isError } = useResetPassword();
  const { data: tokenCheck, isPending: tokenPending, isFetching: tokenFetching, isError: tokenError } = useValidateResetToken(token);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const password = watch('newPassword', '');

  function onSubmit(data: FormData) {
    if (!token) return;
    setSubmitted(true);
    resetPassword({ token, password: data.newPassword });
  }

  if (!token) {
    return <ErrorState t={t} lp={lp} />;
  }

  if (tokenPending || tokenFetching) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-blue-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (tokenError || (tokenCheck && !tokenCheck.valid)) {
    return <ErrorState t={t} lp={lp} />;
  }

  if (submitted && isSuccess) {
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
          href={lp('/login')}
          className="px-6 py-3 btn-primary rounded-xl text-sm font-semibold"
        >
          {t('successBtn')}
        </Link>
      </div>
    );
  }

  if (submitted && isError) {
    return <ErrorState t={t} lp={lp} />;
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">{t('title')}</h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
            {t('newPassword')}
          </label>
          <input
            {...register('newPassword')}
            type="password"
            className="input-dark"
            placeholder="••••••••"
            autoComplete="new-password"
            autoFocus
          />
          {errors.newPassword && <p className="mt-1 text-xs text-red-400">⚠ {errors.newPassword.message}</p>}
          {password && (
            <div className="mt-2 flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
                  password.length >= 8 + i * 4
                    ? i < 2 ? 'bg-cyan-500' : 'bg-blue-500'
                    : 'bg-white/10'
                }`} />
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
            {t('confirmPassword')}
          </label>
          <input
            {...register('confirmPassword')}
            type="password"
            className="input-dark"
            placeholder="••••••••"
            autoComplete="new-password"
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">⚠ {errors.confirmPassword.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 btn-primary rounded-xl text-sm font-semibold"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {t('resetting')}
            </span>
          ) : t('button')}
        </button>
      </form>
    </div>
  );
}

function ErrorState({ t, lp }: { t: ReturnType<typeof useTranslations<'resetPassword'>>; lp: (p: string) => string }) {
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
      <Link href={lp('/')} className="px-6 py-3 btn-ghost rounded-xl text-sm font-semibold">
        {t('errorBtn')}
      </Link>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-10 max-w-md w-full">
        <Suspense fallback={
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-blue-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        }>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
