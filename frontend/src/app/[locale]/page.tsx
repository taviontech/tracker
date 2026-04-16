import { getTranslations } from 'next-intl/server';
import CTAButtons from '../../components/landing/CTAButtons';

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations('home');
  const nav = await getTranslations('nav');
  const lp = (path: string) => locale === 'en' ? path : (path === '/' ? `/${locale}` : `/${locale}${path}`);

  return (
    <div>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden pt-24 pb-20 px-6">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.12]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            {t('badge')}
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6 animate-fade-in-up">
            <span className="gradient-text">{t('title')}</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animate-delay-100">
            {t('subtitle')}
          </p>
          <div className="animate-fade-in-up animate-delay-200">
            <CTAButtons ctaText={t('cta')} registerText={nav('register')} />
          </div>
          <div className="mt-16 flex items-center justify-center gap-6 sm:gap-16 animate-fade-in-up animate-delay-300">
            {[
              { value: t('statsCompaniesValue'), label: t('statsCompaniesLabel') },
              { value: t('statsModulesValue'),   label: t('statsModulesLabel') },
              { value: t('statsTimeValue'),      label: t('statsTimeLabel') },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold gradient-text">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-3">{t('howItWorksLabel')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('howItWorksTitle')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: '🏢', title: t('step1Title'), desc: t('step1Desc') },
              { step: '02', icon: '📚', title: t('step2Title'), desc: t('step2Desc') },
              { step: '03', icon: '📊', title: t('step3Title'), desc: t('step3Desc') },
            ].map((item, i) => (
              <div key={item.step} className="relative glass-card rounded-2xl p-8 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <span className="absolute top-6 right-6 text-xs font-bold text-slate-700 tabular-nums">{item.step}</span>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 z-10">
                    <svg className="text-blue-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-20 px-6 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-3">{t('whyUsLabel')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('features.title')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '👥', title: t('features.roles'), desc: t('features.rolesDesc'), accent: 'from-cyan-500/20 to-teal-500/20', border: 'border-cyan-500/20' },
              { icon: '📖', title: t('features.modules'), desc: t('features.modulesDesc'), accent: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/20' },
              { icon: '📈', title: t('features.progress'), desc: t('features.progressDesc'), accent: 'from-blue-500/20 to-blue-500/20', border: 'border-blue-500/20' },
            ].map((f, i) => (
              <div key={f.title} className="glass-card-hover rounded-2xl p-8 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.accent} border ${f.border} flex items-center justify-center text-2xl mb-5`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="py-20 px-6 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-blue-600/10" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/10 blur-[60px] rounded-full" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('ctaBannerTitle')}</h2>
              <p className="text-slate-400 mb-8 text-base">{t('ctaBannerDesc')}</p>
              <div className="animate-fade-in-up animate-delay-200">
                <CTAButtons ctaText={t('ctaBannerBtn')} registerText={nav('register')} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
