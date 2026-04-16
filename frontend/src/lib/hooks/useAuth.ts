'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { authApi, Membership, User } from '../api';
import { STALE_TIME_LONG_MS } from '../constants';

export interface AuthResponse {
  user: User;
  memberships: Membership[];
}

function useLocalePath() {
  const locale = useLocale();
  return (path: string): string => {
    if (locale === 'en') return path;
    if (path === '/') return `/${locale}`;
    return `/${locale}${path}`;
  };
}

export function useAuth() {
  return useQuery<AuthResponse>({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me().then((r) => r.data),
    retry: false,
    staleTime: STALE_TIME_LONG_MS,
  });
}

function getRedirectPath(memberships: Membership[], systemRole: string, lp: (p: string) => string) {
  if (systemRole === 'ADMIN') return lp('/admin');
  return lp('/dashboard');
}

export function useLogin() {
  const qc = useQueryClient();
  const router = useRouter();
  const lp = useLocalePath();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password).then((r) => r.data as AuthResponse),
    onSuccess: (data) => {
      qc.setQueryData(['auth', 'me'], data);
      router.push(getRedirectPath(data.memberships, data.user.systemRole, lp));
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      email: string; password: string; firstName: string;
      lastName: string; phone?: string; companyName: string;
    }) => authApi.register(data).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(['auth', 'me'], data);
    },
  });
}

export function useValidateResetToken(token: string | null) {
  return useQuery({
    queryKey: ['resetToken', token],
    queryFn: () => authApi.validateResetToken(token!).then((r) => r.data as { valid: boolean }),
    enabled: !!token,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) =>
      authApi.forgotPassword(email),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const lp = useLocalePath();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      qc.clear();
      window.location.href = lp('/');
    },
    onError: () => {
      qc.clear();
      window.location.href = lp('/');
    },
  });
}
