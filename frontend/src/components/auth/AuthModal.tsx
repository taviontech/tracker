'use client';
import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useLogin, useRegister, useForgotPassword } from '../../lib/hooks/useAuth';
import { useAuthModal } from '../../context/AuthModalContext';
import PhoneInput from '../ui/PhoneInput';

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

const registerStep1Schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const registerStep2Schema = z.object({
  firstName: z.string().min(1, 'Required').max(100),
  lastName: z.string().min(1, 'Required').max(100),
  phone: z.string().optional(),
  companyName: z.string().min(1, 'Company name is required').max(255),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterStep1Data = z.infer<typeof registerStep1Schema>;
type RegisterStep2Data = z.infer<typeof registerStep2Schema>;

export default function AuthModal() {
  const { isOpen, view, close, switchView } = useAuthModal();
  const t = useTranslations('auth');

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const mouseDownTarget = useRef<EventTarget | null>(null);
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onMouseDown={(e) => { mouseDownTarget.current = e.target; }}
      onClick={(e) => { if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) close(); }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md animate-fade-in" />
      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="glass-card rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/[0.15]">
          <div className="h-0.5 w-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" />

          {view === 'forgot-password' ? (
            <div className="flex items-center border-b border-white/[0.08] px-2">
              <button onClick={() => switchView('login')} className="flex items-center gap-1.5 p-4 text-sm text-slate-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to login
              </button>
              <button onClick={close} className="ml-auto px-4 py-4 text-slate-600 hover:text-slate-300 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex border-b border-white/[0.08]">
              {(['login', 'register'] as const).map((tab) => (
                <button key={tab} onClick={() => switchView(tab)} className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 ${
                  view === tab ? 'text-white border-b-2 border-blue-500 bg-white/[0.03]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
                }`}>
                  {tab === 'login' ? t('loginTitle') : t('registerTitle')}
                </button>
              ))}
              <button onClick={close} className="px-4 text-slate-600 hover:text-slate-300 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="p-8">
            {view === 'login' && <LoginForm onClose={close} />}
            {view === 'register' && <RegisterForm onClose={close} />}
            {view === 'forgot-password' && <ForgotPasswordForm />}

            {view !== 'forgot-password' && (
              <p className="text-center text-sm text-slate-600 mt-6">
                {view === 'login' ? (
                  <>{t('noAccount')}{' '}<button onClick={() => switchView('register')} className="text-blue-400 hover:text-blue-300 font-medium">{t('signUp')}</button></>
                ) : (
                  <>{t('haveAccount')}{' '}<button onClick={() => switchView('login')} className="text-blue-400 hover:text-blue-300 font-medium">{t('signIn')}</button></>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordForm() {
  const { mutate: forgotPassword, isPending, isSuccess } = useForgotPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: z.string().email('Valid email required') })),
  });

  if (isSuccess) return (
    <div className="flex flex-col items-center gap-5 text-center py-4">
      <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
        <svg className="w-7 h-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Check your email</h3>
        <p className="text-slate-400 text-sm">If the email exists, a reset link was sent.</p>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit((d) => forgotPassword({ email: d.email }))} className="space-y-5">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold text-white mb-1">Forgot Password</h3>
        <p className="text-slate-400 text-sm">Enter your email to receive a reset link.</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
        <input {...register('email')} type="email" className="input-dark" placeholder="you@example.com" autoFocus />
        {errors.email && <p className="mt-1 text-xs text-red-400">⚠ {errors.email.message}</p>}
      </div>
      <button type="submit" disabled={isPending} className="w-full py-3 btn-primary rounded-xl text-sm font-semibold">
        {isPending ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  );
}

function LoginForm({ onClose }: { onClose: () => void }) {
  const { mutate: login, isPending, error } = useLogin();
  const { switchView } = useAuthModal();
  const t = useTranslations('auth');
  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit((d) => login(d, { onSuccess: onClose }))} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{t('emailLabel')}</label>
        <input {...register('email')} type="email" className="input-dark" placeholder="you@example.com" autoComplete="email" autoFocus />
        {errors.email && <p className="mt-1 text-xs text-red-400">⚠ {errors.email.message}</p>}
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">{t('passwordLabel')}</label>
          <button type="button" onClick={() => switchView('forgot-password')} className="text-xs text-blue-400 hover:text-blue-300">
            {t('forgotPassword')}
          </button>
        </div>
        <input {...register('password')} type="password" className="input-dark" placeholder="••••••••" autoComplete="current-password" />
        {errors.password && <p className="mt-1 text-xs text-red-400">⚠ {errors.password.message}</p>}
      </div>
      {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">⚠️ Invalid email or password</div>}
      <button type="submit" disabled={isPending} className="w-full py-3 btn-primary rounded-xl text-sm font-semibold">
        {isPending ? 'Signing in...' : t('loginBtn')}
      </button>
    </form>
  );
}

function RegisterForm({ onClose }: { onClose: () => void }) {
  const { mutate: registerUser, isPending, error } = useRegister();
  const t = useTranslations('auth');
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<RegisterStep1Data | null>(null);

  const step1Form = useForm<RegisterStep1Data>({ resolver: zodResolver(registerStep1Schema) });
  const step2Form = useForm<RegisterStep2Data>({ resolver: zodResolver(registerStep2Schema) });

  const password = step1Form.watch('password', '');
  const confirmPassword = step1Form.watch('confirmPassword', '');
  const passwordsMatch = password.length >= 8 && confirmPassword && password === confirmPassword;

  function onStep1Submit(data: RegisterStep1Data) { setStep1Data(data); setStep(2); }

  function onStep2Submit(data: RegisterStep2Data) {
    if (!step1Data) return;
    registerUser({
      email: step1Data.email,
      password: step1Data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      companyName: data.companyName,
    }, { onSuccess: onClose });
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-500'}`}>1</div>
        <div className={`h-0.5 flex-1 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-white/10'}`} />
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-500'}`}>2</div>
        <span className="text-xs text-slate-500 ml-2">{step === 1 ? 'Account' : 'Details'}</span>
      </div>

      {step === 1 && (
        <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{t('emailLabel')}</label>
            <input {...step1Form.register('email')} type="email" className="input-dark" placeholder="you@company.com" autoFocus />
            {step1Form.formState.errors.email && <p className="mt-1 text-xs text-red-400">⚠ {step1Form.formState.errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{t('passwordLabel')}</label>
            <input {...step1Form.register('password')} type="password" className="input-dark" placeholder="••••••••" autoComplete="new-password" />
            {step1Form.formState.errors.password && <p className="mt-1 text-xs text-red-400">⚠ {step1Form.formState.errors.password.message}</p>}
            {password && (
              <div className="mt-2 flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`h-0.5 flex-1 rounded-full transition-all ${password.length >= 8 + i * 4 ? (i < 2 ? 'bg-cyan-500' : 'bg-blue-500') : 'bg-white/10'}`} />
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Confirm Password</label>
            <div className="relative">
              <input {...step1Form.register('confirmPassword')} type="password" className="input-dark pr-8" placeholder="••••••••" autoComplete="new-password" />
              {confirmPassword && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">{passwordsMatch ? <span className="text-cyan-400">✓</span> : <span className="text-red-400">✗</span>}</span>}
            </div>
            {step1Form.formState.errors.confirmPassword && <p className="mt-1 text-xs text-red-400">⚠ {step1Form.formState.errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" className="w-full py-3 btn-primary rounded-xl text-sm font-semibold">Next</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{t('firstNameLabel')}</label>
              <input {...step2Form.register('firstName')} type="text" className="input-dark" placeholder="John" autoFocus />
              {step2Form.formState.errors.firstName && <p className="mt-1 text-xs text-red-400">⚠ {step2Form.formState.errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{t('lastNameLabel')}</label>
              <input {...step2Form.register('lastName')} type="text" className="input-dark" placeholder="Doe" />
              {step2Form.formState.errors.lastName && <p className="mt-1 text-xs text-red-400">⚠ {step2Form.formState.errors.lastName.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{t('companyNameLabel')}</label>
            <input {...step2Form.register('companyName')} type="text" className="input-dark" placeholder="Acme Corp" />
            {step2Form.formState.errors.companyName && <p className="mt-1 text-xs text-red-400">⚠ {step2Form.formState.errors.companyName.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{t('phoneLabel')} (optional)</label>
            <Controller name="phone" control={step2Form.control} render={({ field }) => (
              <PhoneInput value={field.value || ''} onChange={field.onChange} />
            )} />
          </div>
          {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">⚠️ Registration failed. Please try again.</div>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-400 border border-white/[0.08] hover:border-white/20 hover:text-white transition-all">Back</button>
            <button type="submit" disabled={isPending} className="flex-[2] py-3 btn-primary rounded-xl text-sm font-semibold">
              {isPending ? 'Creating account...' : t('registerBtn')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
