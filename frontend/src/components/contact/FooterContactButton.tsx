'use client';
import { useTranslations } from 'next-intl';
import { useContactModal } from '../../context/ContactModalContext';

export default function FooterContactButton() {
  const { open } = useContactModal();
  const t = useTranslations('about');

  return (
    <button
      onClick={open}
      className="text-sm text-slate-500 hover:text-blue-400 transition-colors duration-200 flex items-center gap-1.5 group"
    >
      <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      {t('contactBtn')}
    </button>
  );
}
