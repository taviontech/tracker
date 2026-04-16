'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthModal } from '../../../context/AuthModalContext';
import { useLocalePath } from '../../../lib/hooks/useLocalePath';

export default function LoginPage() {
  const router = useRouter();
  const { openLogin } = useAuthModal();
  const lp = useLocalePath();

  useEffect(() => {
    openLogin();
    router.replace(lp('/'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
