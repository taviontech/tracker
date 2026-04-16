'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthModalProvider } from '../context/AuthModalContext';
import { ContactModalProvider } from '../context/ContactModalContext';
import { ThemeProvider } from '../context/ThemeContext';
import { STALE_TIME_DEFAULT_MS } from '../lib/constants';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: STALE_TIME_DEFAULT_MS },
          mutations: { retry: 0 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthModalProvider>
          <ContactModalProvider>
            {children}
          </ContactModalProvider>
        </AuthModalProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
