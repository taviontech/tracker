'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { invitationsApi } from '../../../../lib/api';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

interface InvitationInfo {
  email: string;
  companyName: string;
  role: string;
}

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const locale = useLocale();
  const t = useTranslations('invite');
  const lp = (p: string) => locale === 'en' ? p : `/${locale}${p}`;

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!token) { setError(t('invalidLink')); setLoading(false); return; }
    invitationsApi.validate(token)
      .then((r) => { setInfo(r.data); setLoading(false); })
      .catch(() => { setError(t('invalidOrExpired')); setLoading(false); });
  }, [token, t]);

  async function onSubmit(data: FormData) {
    if (!token) return;
    setSubmitting(true);
    try {
      await invitationsApi.accept({ token, firstName: data.firstName, lastName: data.lastName, password: data.password });
      router.push(lp('/dashboard'));
    } catch {
      setError(t('failedAccept'));
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-card rounded-2xl p-10 text-center max-w-md w-full">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">{t('invalidTitle')}</h2>
        <p className="text-slate-400 text-sm">{error}</p>
      </div>
    </div>
  );

  const roleLabel = info?.role === 'MANAGER' ? 'Manager' : t('newEmployee');

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.12]">
          <div className="h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-indigo-500" />
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/20 border border-blue-500/30 flex items-center justify-center text-2xl mx-auto mb-4">
                🎉
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">{t('youreInvited')}</h1>
              <p className="text-slate-400 text-sm">
                {t('joinAs', { company: info?.companyName ?? '', role: roleLabel })}
              </p>
              <p className="text-slate-500 text-xs mt-1">{info?.email}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{t('firstNameLabel')}</label>
                  <input {...register('firstName')} className="input-dark" placeholder="John" autoFocus />
                  {errors.firstName && <p className="mt-1 text-xs text-red-400">⚠ {errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{t('lastNameLabel')}</label>
                  <input {...register('lastName')} className="input-dark" placeholder="Doe" />
                  {errors.lastName && <p className="mt-1 text-xs text-red-400">⚠ {errors.lastName.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{t('passwordLabel')}</label>
                <input {...register('password')} type="password" className="input-dark" placeholder={t('passwordPlaceholder')} />
                {errors.password && <p className="mt-1 text-xs text-red-400">⚠ {errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{t('confirmPasswordLabel')}</label>
                <input {...register('confirmPassword')} type="password" className="input-dark" placeholder="••••••••" />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">⚠ {errors.confirmPassword.message}</p>}
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">⚠️ {error}</div>}
              <button type="submit" disabled={submitting} className="w-full py-3 btn-primary rounded-xl text-sm font-semibold">
                {submitting ? t('joining') : t('joinCompany')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
