'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useContactModal } from '../../context/ContactModalContext';
import { api } from '../../lib/api';
import { MODAL_CLOSE_ANIMATION_MS } from '../../lib/constants';

const schema = z.object({
  name: z.string().min(1, 'Required').max(100),
  email: z.string().email('Valid email required'),
  category: z.string().min(1, 'Please select a category'),
  message: z.string().min(10, 'At least 10 characters').max(2000),
});

type FormData = z.infer<typeof schema>;

export default function ContactModal() {
  const { isOpen, close } = useContactModal();
  const t = useTranslations('contact');
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  function handleClose() {
    close();
    setTimeout(() => { reset(); setSent(false); setServerError(false); }, MODAL_CLOSE_ANIMATION_MS);
  }

  async function onSubmit(data: FormData) {
    setServerError(false);
    try {
      await api.post('/api/contact', data);
      setSent(true);
    } catch {
      setServerError(true);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md animate-fade-in" />

      <div className="relative w-full max-w-lg animate-fade-in-up">
        <div className="glass-card rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/[0.15]">
          <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 via-fuchsia-500 to-blue-500" />

          <div className="flex items-center justify-between px-8 pt-6 pb-2">
            <h2 className="text-xl font-bold text-white">{t('title')}</h2>
            <button
              onClick={handleClose}
              className="text-slate-600 hover:text-slate-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-8 pb-8">
            {sent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{t('successTitle')}</h3>
                <p className="text-slate-400 text-sm mb-6">{t('successDesc')}</p>
                <button onClick={handleClose} className="px-6 py-2.5 btn-primary rounded-xl text-sm font-semibold">
                  OK
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{t('name')}</label>
                    <input
                      {...register('name')}
                      type="text"
                      className="input-dark"
                      placeholder={t('namePlaceholder')}
                      autoFocus
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-400">⚠ {errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{t('email')}</label>
                    <input
                      {...register('email')}
                      type="email"
                      className="input-dark"
                      placeholder={t('emailPlaceholder')}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-400">⚠ {errors.email.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{t('category')}</label>
                  <select
                    {...register('category')}
                    className="input-dark"
                    defaultValue=""
                  >
                    <option value="" disabled>{t('category')}</option>
                    <option value="general">{t('categoryGeneral')}</option>
                    <option value="bug">{t('categoryBug')}</option>
                    <option value="partnership">{t('categoryPartnership')}</option>
                    <option value="other">{t('categoryOther')}</option>
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-400">⚠ {errors.category.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{t('message')}</label>
                  <textarea
                    {...register('message')}
                    rows={4}
                    className="input-dark resize-none"
                    placeholder={t('messagePlaceholder')}
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-400">⚠ {errors.message.message}</p>}
                </div>

                {serverError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">
                    <span>⚠️</span> {t('error')}
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="w-full py-3 btn-primary rounded-xl text-sm font-semibold">
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      {t('sending')}
                    </span>
                  ) : t('send')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
