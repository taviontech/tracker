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
      limits: [
        { label: `3 ${t('managers')}` },
        { label: `10 ${t('modules')}` },
        { label: `3 ${t('groups')}` },
        { label: `20 ${t('newbies')}` },
      ],
      available: true,
      highlighted: false,
    },
    {
      tier: 'PRO',
      title: t('pro'),
      desc: t('proDesc'),
      price: t('proPrice'),
      limits: [
        { label: `${t('unlimited')} ${t('managers')}` },
        { label: `${t('unlimited')} ${t('modules')}` },
        { label: `${t('unlimited')} ${t('groups')}` },
        { label: `${t('unlimited')} ${t('newbies')}` },
      ],
      available: false,
      highlighted: true,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">{t('title')}</h1>
        <p className="text-slate-400 text-lg">{t('subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {planCards.map(plan => {
          const isCurrent = currentTier === plan.tier;
          return (
            <div key={plan.tier} className={`relative rounded-2xl p-8 flex flex-col ${
              plan.highlighted
                ? 'bg-gradient-to-br from-blue-500/10 to-blue-500/10 border border-blue-500/40'
                : 'glass-card border border-white/[0.08]'
            }`}>
              {isCurrent && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
                  {t('currentPlan')}
                </div>
              )}
              {!plan.available && !isCurrent && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                  {t('comingSoon')}
                </div>
              )}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">{plan.title}</h2>
                <p className="text-slate-400 text-sm mb-4">{plan.desc}</p>
                <p className="text-4xl font-bold text-white">{plan.price}</p>
              </div>
              <ul className="space-y-3 flex-1">
                {plan.limits.map((l, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">&#10003;</span>
                    {l.label}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {plan.available && !isCurrent && (
                  <button className="w-full py-3 btn-primary rounded-xl text-sm font-semibold">{t('upgrade')}</button>
                )}
                {isCurrent && (
                  <div className="w-full py-3 rounded-xl border border-cyan-500/30 text-center text-cyan-400 text-sm font-semibold">{t('active')}</div>
                )}
                {!plan.available && (
                  <div className="w-full py-3 rounded-xl border border-white/10 text-center text-slate-500 text-sm font-semibold cursor-not-allowed">{t('comingSoon')}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
