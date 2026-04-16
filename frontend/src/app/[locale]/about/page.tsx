import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import AboutContactButton from '../../../components/contact/AboutContactButton';

export default async function AboutPage() {
  const t = await getTranslations('about');

  const stats = [
    { value: t('stat1Value'), label: t('stat1Label') },
    { value: t('stat2Value'), label: t('stat2Label') },
    { value: t('stat3Value'), label: t('stat3Label') },
  ];

  const features = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 01.448 10.107c0 5.042 3.324 9.285 7.927 10.684a11.934 11.934 0 004.75 1.209A11.99 11.99 0 0019.5 12c0-6.628-5.373-12-12-12z" />
        </svg>
      ),
      title: t('feature1Title'),
      desc: t('feature1Desc'),
      color: 'from-blue-500/20 to-blue-600/10',
      border: 'border-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      title: t('feature2Title'),
      desc: t('feature2Desc'),
      color: 'from-violet-500/20 to-purple-600/10',
      border: 'border-violet-500/20',
      iconColor: 'text-violet-400',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      title: t('feature3Title'),
      desc: t('feature3Desc'),
      color: 'from-emerald-500/20 to-teal-600/10',
      border: 'border-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      {/* Hero */}
      <div className="text-center mb-16 animate-fade-in-up">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <Image
              src="/images/taviontech-logo.png"
              alt="TavionTech"
              width={220}
              height={56}
              className="h-14 w-auto"
              priority
            />
            <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full" />
          </div>
        </div>
        <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full mb-5 uppercase tracking-wider">
          {t('badge')}
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('title')}</h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">{t('subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="gradient-border-card rounded-2xl p-6 text-center animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="text-3xl font-bold gradient-text mb-1.5">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Mission */}
      <div className="relative glass-card rounded-2xl p-8 mb-8 animate-fade-in-up overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">{t('missionTitle')}</h2>
          </div>
          <p className="text-slate-400 leading-relaxed">{t('missionText')}</p>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {features.map((f, i) => (
          <div
            key={i}
            className="gradient-border-card rounded-2xl p-6 animate-fade-in-up"
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} border ${f.border} flex items-center justify-center ${f.iconColor} mb-4`}>
              {f.icon}
            </div>
            <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="relative glass-card rounded-2xl p-10 text-center animate-fade-in-up border border-blue-500/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-blue-600/5" />
        {/* Orbit decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="orbit-ring" style={{ width: 280, height: 280, opacity: 0.5 }} />
          <div className="absolute top-4 right-12 w-1.5 h-1.5 rounded-full bg-blue-400 animate-glow-pulse" />
          <div className="absolute bottom-6 left-12 w-1 h-1 rounded-full bg-blue-300 animate-glow-pulse animate-delay-300" />
        </div>
        <div className="relative">
          <h2 className="text-2xl font-bold text-white mb-3">{t('contactTitle')}</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">{t('contactDesc')}</p>
          <AboutContactButton label={t('contactBtn')} />
        </div>
      </div>
    </div>
  );
}
