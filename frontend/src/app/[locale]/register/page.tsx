'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthModal } from '../../../context/AuthModalContext';
import { useLocalePath } from '../../../lib/hooks/useLocalePath';

export default function RegisterPage() {
  const router = useRouter();
  const { openRegister } = useAuthModal();
  const lp = useLocalePath();

  useEffect(() => {
    openRegister();
    router.replace(lp('/'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
