import { getTranslations } from 'next-intl/server';
import CTAButtons from '../../components/landing/CTAButtons';
import TiltCard from '../../components/ui/TiltCard';

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations('home');
  const nav = await getTranslations('nav');
  const lp = (path: string) => locale === 'en' ? path : (path === '/' ? `/${locale}` : `/${locale}${path}`);

  return (
    <div className="relative">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden pt-24 pb-32 px-6 min-h-[92vh] flex items-center">
        {/* Perspective grid */}
        <div className="hero-grid">
          <div className="hero-grid-inner" />
        </div>

        {/* Top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/12 blur-[140px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium mb-8 animate-fade-in backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            {t('badge')}
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6 animate-fade-in-up">
            <span className="gradient-text glow-text">{t('title')}</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animate-delay-100">
            {t('subtitle')}
          </p>

          <div className="animate-fade-in-up animate-delay-200">
            <CTAButtons ctaText={t('cta')} registerText={nav('register')} />
          </div>

          {/* Stats */}
          <div className="mt-16 flex items-center justify-center gap-8 sm:gap-16 animate-fade-in-up animate-delay-300">
            {[
              { value: t('statsCompaniesValue'), label: t('statsCompaniesLabel') },
              { value: t('statsModulesValue'),   label: t('statsModulesLabel') },
              { value: t('statsTimeValue'),      label: t('statsTimeLabel') },
            ].map((s, i) => (
              <div key={s.label} className="text-center relative">
                {i < 2 && (
                  <div className="absolute -right-4 sm:-right-8 top-1/2 -translate-y-1/2 w-px h-8 bg-white/10" />
                )}
                <div className="text-2xl sm:text-3xl font-bold gradient-text">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Floating Kanban preview */}
          <div className="mt-20 animate-fade-in-up animate-delay-400">
            <TiltCard
              className="relative max-w-3xl mx-auto rounded-2xl glass-card scan-container overflow-hidden"
              intensity={5}
            >
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06]">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <div className="ml-3 flex-1 h-5 rounded bg-white/[0.04] max-w-[180px]" />
                <div className="h-5 w-16 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-semibold flex items-center justify-center">
                  Sprint 4
                </div>
              </div>

              {/* Kanban columns */}
              <div className="grid grid-cols-3 gap-3 p-4">
                {[
                  {
                    col: 'To Do',
                    color: 'text-slate-400',
                    dot: 'bg-slate-500',
                    cards: [
                      { title: 'Design system tokens', type: 'TASK', priority: 'medium' },
                      { title: 'API rate limiting', type: 'BUG', priority: 'high' },
                    ],
                  },
                  {
                    col: 'In Progress',
                    color: 'text-blue-400',
                    dot: 'bg-blue-500',
                    cards: [
                      { title: 'Kanban drag & drop', type: 'STORY', priority: 'high' },
                      { title: 'Sprint velocity chart', type: 'TASK', priority: 'medium' },
                    ],
                  },
                  {
                    col: 'Done',
                    color: 'text-emerald-400',
                    dot: 'bg-emerald-500',
                    cards: [
                      { title: 'Auth flow redesign', type: 'TASK', priority: 'low' },
                      { title: 'Email notifications', type: 'TASK', priority: 'low' },
                    ],
                  },
                ].map(column => (
                  <div key={column.col}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2 h-2 rounded-full ${column.dot}`} />
                      <span className={`text-xs font-semibold ${column.color}`}>{column.col}</span>
                      <span className="ml-auto text-[10px] text-slate-600 bg-white/[0.04] px-1.5 py-0.5 rounded-full">{column.cards.length}</span>
                    </div>
                    <div className="space-y-2">
                      {column.cards.map(card => (
                        <div key={card.title} className="kanban-card-mini">
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <span className="text-[11px] text-white leading-tight font-medium">{card.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              card.type === 'BUG' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                              card.type === 'STORY' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                              'text-blue-400 bg-blue-500/10 border-blue-500/20'
                            }`}>{card.type}</span>
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${
                              card.priority === 'high' ? 'priority-high' :
                              card.priority === 'medium' ? 'priority-medium' :
                              'priority-low'
                            }`}>{card.priority.toUpperCase()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* ─── Tech badges marquee ─── */}
      <div className="py-8 border-y border-white/[0.04] overflow-hidden">
        <div className="flex gap-4 animate-marquee whitespace-nowrap w-max">
          {['Sprint Planning', 'Kanban Boards', 'Ticket Tracking', 'Team Roles', 'Backlog Management', 'Progress Analytics', 'Comment Threads', 'File Attachments', 'Sprint Velocity', 'Custom Workflows', 'Sprint Planning', 'Kanban Boards', 'Ticket Tracking', 'Team Roles', 'Backlog Management', 'Progress Analytics', 'Comment Threads', 'File Attachments', 'Sprint Velocity', 'Custom Workflows'].map((tag, i) => (
            <span key={i} className="tech-badge-pill">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ─── How it works ─── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-3">{t('howItWorksLabel')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('howItWorksTitle')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: '🏢', title: t('step1Title'), desc: t('step1Desc'), color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/20' },
              { step: '02', icon: '🎯', title: t('step2Title'), desc: t('step2Desc'), color: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/20' },
              { step: '03', icon: '📊', title: t('step3Title'), desc: t('step3Desc'), color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/20' },
            ].map((item, i) => (
              <div
                key={item.step}
                className="relative gradient-border-card rounded-2xl p-8 animate-fade-in-up"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <span className="absolute top-5 right-5 text-xs font-bold text-slate-700 tabular-nums">{item.step}</span>
                <div className={`service-icon-wrap bg-gradient-to-br ${item.color} border ${item.border}`}>
                  {item.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-3">{t('whyUsLabel')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{t('features.title')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '👥',
                title: t('features.roles'),
                desc: t('features.rolesDesc'),
                accent: 'from-cyan-500/20 to-teal-500/20',
                border: 'border-cyan-500/20',
                glow: 'rgba(6,182,212,0.15)',
              },
              {
                icon: '📋',
                title: t('features.modules'),
                desc: t('features.modulesDesc'),
                accent: 'from-amber-500/20 to-orange-500/20',
                border: 'border-amber-500/20',
                glow: 'rgba(245,158,11,0.15)',
              },
              {
                icon: '📈',
                title: t('features.progress'),
                desc: t('features.progressDesc'),
                accent: 'from-blue-500/20 to-indigo-500/20',
                border: 'border-blue-500/20',
                glow: 'rgba(59,130,246,0.15)',
              },
            ].map((f, i) => (
              <TiltCard
                key={f.title}
                className={`gradient-border-card rounded-2xl p-8 animate-fade-in-up overflow-hidden`}
                style={{ animationDelay: `${i * 120}ms` }}
                intensity={6}
              >
                <div className={`service-icon-wrap bg-gradient-to-br ${f.accent} border ${f.border}`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </TiltCard>
            ))}
          </div>

        </div>
      </section>

      {/* ─── Sprint workflow visual ─── */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-3">Sprint Lifecycle</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Full control over every sprint
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                Plan, execute, and review sprints with flexible custom columns. Move tickets across stages, track velocity, and keep your team aligned.
              </p>
              <div className="space-y-4">
                {[
                  { label: 'Planning', desc: 'Define goals, assign tickets, set timeline', status: 'PLANNING', color: 'text-slate-400 bg-slate-500/15 border-slate-500/25' },
                  { label: 'Active', desc: 'Execute with real-time kanban tracking', status: 'ACTIVE', color: 'text-blue-400 bg-blue-500/15 border-blue-500/25' },
                  { label: 'Paused', desc: 'Pause and resume with full context preserved', status: 'PAUSED', color: 'text-amber-400 bg-amber-500/15 border-amber-500/25' },
                  { label: 'Completed', desc: 'Review metrics and move to backlog', status: 'COMPLETED', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25' },
                ].map((s, i) => (
                  <div
                    key={s.status}
                    className="flex items-center gap-4 animate-fade-in-up"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <span className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-bold ${s.color}`}>{s.status}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{s.label}</p>
                      <p className="text-xs text-slate-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side - ticket cards visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/5 rounded-3xl blur-3xl" />
              <div className="relative space-y-3">
                {[
                  { id: 'TRK-142', title: 'Implement drag & drop for kanban', type: 'STORY', priority: 'HIGH', assignee: 'VA', progress: 75 },
                  { id: 'TRK-143', title: 'Fix sprint velocity calculation bug', type: 'BUG', priority: 'CRITICAL', assignee: 'MK', progress: 40 },
                  { id: 'TRK-144', title: 'Add attachment preview modal', type: 'TASK', priority: 'MEDIUM', assignee: 'AS', progress: 90 },
                ].map((ticket, i) => (
                  <TiltCard
                    key={ticket.id}
                    className="glass-card rounded-xl p-4 overflow-hidden"
                    intensity={4}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-[10px] text-slate-600 font-mono">{ticket.id}</span>
                      <div className="flex gap-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          ticket.type === 'BUG' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                          ticket.type === 'STORY' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                          'text-blue-400 bg-blue-500/10 border-blue-500/20'
                        }`}>{ticket.type}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          ticket.priority === 'CRITICAL' ? 'priority-critical' :
                          ticket.priority === 'HIGH' ? 'priority-high' :
                          'priority-medium'
                        }`}>{ticket.priority}</span>
                      </div>
                    </div>
                    <p className="text-sm text-white font-medium mb-3">{ticket.title}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                          style={{ width: `${ticket.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">{ticket.progress}%</span>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/30 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-300">
                        {ticket.assignee}
                      </div>
                    </div>
                  </TiltCard>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl glass-card p-12 text-center overflow-hidden">
            {/* Orbit decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="orbit-ring" style={{ width: 320, height: 320 }} />
              <div className="orbit-ring" style={{ width: 480, height: 480, opacity: 0.5 }} />
              <div className="absolute top-6 right-12 w-2 h-2 rounded-full bg-blue-400 animate-glow-pulse" />
              <div className="absolute bottom-8 left-16 w-1.5 h-1.5 rounded-full bg-blue-300 animate-glow-pulse animate-delay-300" />
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-blue-600/10 rounded-3xl" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/10 blur-[60px] rounded-full" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Free to start
              </div>
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
