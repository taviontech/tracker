'use client';
import Link from 'next/link';
import { useAuthModal } from '../../context/AuthModalContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { useLocalePath } from '../../lib/hooks/useLocalePath';

interface Props {
  ctaText: string;
  registerText?: string;
}

export default function CTAButtons({ ctaText }: Props) {
  const { openRegister } = useAuthModal();
  const { data: user } = useAuth();
  const lp = useLocalePath();

  if (user) {
    return (
      <div className="flex justify-center">
        <Link
          href={lp('/dashboard')}
          className="px-8 py-3.5 btn-primary rounded-xl text-base font-semibold inline-flex items-center justify-center gap-2"
        >
          {ctaText}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <button
        onClick={openRegister}
        className="px-8 py-3.5 btn-primary rounded-xl text-base font-semibold inline-flex items-center justify-center gap-2"
      >
        {ctaText}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  );
}
