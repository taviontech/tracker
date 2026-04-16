'use client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { plansApi } from '../../../lib/api';
import { useAuth } from '../../../lib/hooks/useAuth';

export default function PlansPage() {
  const t = useTranslations('plans');
  const { data: auth } = useAuth();
  const companyId = auth?.memberships?.[0]?.companyId;
  const role = auth?.memberships?.[0]?.role;

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.getPlans().then(r => r.data),
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription', companyId],
    queryFn: () => plansApi.getSubscription(companyId!).then(r => r.data),
    enabled: !!companyId && (role === 'OWNER'),
  });

  const currentTier = subscriptionData?.subscription?.planTier ?? null;

  const planCards = [
    {
      tier: 'FREE',
      title: t('free'),
      desc: t('freeDesc'),
      price: t('freePrice'),
      period: '/mo',
      limits: [
        { label: `3 ${t('managers')}`, icon: '👥' },
        { label: `10 ${t('modules')}`, icon: '📋' },
        { label: `3 ${t('groups')}`, icon: '🏷️' },
        { label: `20 ${t('newbies')}`, icon: '👤' },
      ],
      available: true,
      highlighted: false,
      accent: 'from-slate-500/10 to-slate-600/10',
      border: 'border-white/[0.08]',
    },
    {
      tier: 'PRO',
      title: t('pro'),
      desc: t('proDesc'),
      price: t('proPrice'),
      period: '/mo',
      limits: [
        { label: `${t('unlimited')} ${t('managers')}`, icon: '👥' },
        { label: `${t('unlimited')} ${t('modules')}`, icon: '📋' },
        { label: `${t('unlimited')} ${t('groups')}`, icon: '🏷️' },
        { label: `${t('unlimited')} ${t('newbies')}`, icon: '👤' },
      ],
      available: false,
      highlighted: true,
      accent: 'from-blue-600/15 to-indigo-600/10',
      border: 'border-blue-500/30',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="text-center mb-16 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Simple pricing
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">{t('title')}</h1>
        <p className="text-slate-400 text-lg">{t('subtitle')}</p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {planCards.map((plan, i) => {
          const isCurrent = currentTier === plan.tier;
          return (
            <div
              key={plan.tier}
              className={`relative rounded-2xl p-8 flex flex-col animate-fade-in-up overflow-hidden ${
                plan.highlighted
                  ? `bg-gradient-to-br ${plan.accent} border ${plan.border}`
                  : `glass-card ${plan.border}`
              }`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              {/* Glow for pro */}
              {plan.highlighted && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none" />
              )}

              {/* Status badge */}
              {isCurrent && (
                <div className="absolute top-5 right-5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  {t('currentPlan')}
                </div>
              )}
              {!plan.available && !isCurrent && (
                <div className="absolute top-5 right-5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                  {t('comingSoon')}
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6 relative">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-br ${plan.accent} border ${plan.border} mb-4`}>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{plan.tier}</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{plan.title}</h2>
                <p className="text-slate-400 text-sm mb-5">{plan.desc}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-500 text-sm mb-1">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 flex-1 mb-8">
                {plan.limits.map((l, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      plan.highlighted
                        ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                        : 'bg-white/[0.06] border border-white/10 text-slate-400'
                    }`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {l.label}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div>
                {plan.available && !isCurrent && (
                  <button className="w-full py-3 btn-primary rounded-xl text-sm font-semibold">{t('upgrade')}</button>
                )}
                {isCurrent && (
                  <div className="w-full py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center text-emerald-400 text-sm font-semibold">{t('active')}</div>
                )}
                {!plan.available && !isCurrent && (
                  <div className="w-full py-3 rounded-xl border border-white/10 bg-white/[0.03] text-center text-slate-600 text-sm font-semibold cursor-not-allowed">{t('comingSoon')}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature comparison note */}
      <div className="glass-card rounded-2xl p-6 text-center animate-fade-in-up animate-delay-300">
        <p className="text-sm text-slate-500">
          All plans include core features: sprint management, kanban boards, ticket tracking, team collaboration, and file attachments.
        </p>
      </div>
    </div>
  );
}
