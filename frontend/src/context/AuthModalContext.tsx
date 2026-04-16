'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

export type ModalView = 'login' | 'register' | 'forgot-password';

interface AuthModalContextType {
  isOpen: boolean;
  view: ModalView;
  openLogin: () => void;
  openRegister: () => void;
  openForgotPassword: () => void;
  close: () => void;
  switchView: (v: ModalView) => void;
}

const AuthModalContext = createContext<AuthModalContextType | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ModalView>('login');

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        view,
        openLogin: () => { setView('login'); setIsOpen(true); },
        openRegister: () => { setView('register'); setIsOpen(true); },
        openForgotPassword: () => { setView('forgot-password'); setIsOpen(true); },
        close: () => setIsOpen(false),
        switchView: (v) => setView(v),
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider');
  return ctx;
}
