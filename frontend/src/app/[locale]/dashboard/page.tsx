'use client';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { teamApi, sprintsApi, ticketsApi } from '../../../lib/api';

export default function DashboardPage() {
  const locale = useLocale();
  const t = useTranslations('dashboardOverview');
  const lp = (p: string) => locale === 'en' ? p : `/${locale}${p}`;
  const { data: auth } = useAuth();

  const companyId = auth?.memberships?.[0]?.companyId;
  const role = auth?.memberships?.[0]?.role;

  const { data: team } = useQuery({
    queryKey: ['team', companyId],
    queryFn: () => teamApi.getTeam(companyId!).then(r => r.data),
    enabled: !!companyId,
  });

  const { data: sprints } = useQuery({
    queryKey: ['sprints', companyId],
    queryFn: () => sprintsApi.list(companyId!).then(r => r.data),
    enabled: !!companyId,
  });

  const { data: tickets } = useQuery({
    queryKey: ['tickets', companyId],
    queryFn: () => ticketsApi.list(companyId!).then(r => r.data),
    enabled: !!companyId,
  });

  const activeSprint = (sprints as any[])?.find((s: any) => s.status === 'ACTIVE');
  const todoCount = (tickets as any[])?.filter((t: any) => t.status === 'TODO').length ?? 0;
  const inProgressCount = (tickets as any[])?.filter((t: any) => t.status === 'IN_PROGRESS').length ?? 0;
  const doneCount = (tickets as any[])?.filter((t: any) => t.status === 'DONE').length ?? 0;
  const totalTickets = (tickets as any[])?.length ?? 0;
  const myTickets = (tickets as any[])?.filter((t: any) => t.assignee?.email === auth?.user?.email) ?? [];

  const donePercent = totalTickets > 0 ? Math.round((doneCount / totalTickets) * 100) : 0;
  const inProgressPercent = totalTickets > 0 ? Math.round((inProgressCount / totalTickets) * 100) : 0;

  const cards = [
    {
      href: lp('/dashboard/team'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: t('teamCard'),
      value: team?.length ?? 0,
      unit: t('membersUnit'),
      color: 'from-cyan-500/20 to-teal-500/20',
      border: 'border-cyan-500/20',
      glow: 'rgba(6,182,212,0.2)',
      iconColor: 'text-cyan-400',
    },
    {
      href: lp('/dashboard/boards'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
      label: t('boardsCard'),
      value: (sprints as any[])?.length ?? 0,
      unit: t('sprintsUnit'),
      color: 'from-blue-500/20 to-indigo-500/20',
      border: 'border-blue-500/20',
      glow: 'rgba(59,130,246,0.2)',
      iconColor: 'text-blue-400',
    },
    {
      href: lp('/dashboard/tickets'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      label: t('ticketsCard'),
      value: totalTickets,
      unit: t('totalUnit'),
      color: 'from-violet-500/20 to-purple-500/20',
      border: 'border-violet-500/20',
      glow: 'rgba(139,92,246,0.2)',
      iconColor: 'text-violet-400',
    },
    {
      href: lp('/dashboard/tickets?assignee=me'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
      label: t('myTicketsCard'),
      value: myTickets.length,
      unit: t('assignedUnit'),
      color: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/20',
      glow: 'rgba(245,158,11,0.2)',
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
        </div>
        <p className="text-slate-400 text-sm pl-5">
          {auth?.memberships?.[0]?.companyName} ·{' '}
          <span className="text-blue-300 font-medium">{role}</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {cards.map((c, i) => (
          <Link
            key={c.href}
            href={c.href}
            className="gradient-border-card rounded-2xl p-6 group animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} border ${c.border} flex items-center justify-center mb-4 ${c.iconColor} group-hover:scale-110 transition-transform duration-200`}>
              {c.icon}
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{c.value}</p>
            <p className="text-xs text-slate-500">{c.label} · {c.unit}</p>
          </Link>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Ticket status */}
        <div className="glass-card rounded-2xl p-6 animate-fade-in-up animate-delay-300">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-white">{t('ticketStatusTitle')}</h2>
            <span className="text-xs text-slate-600">{totalTickets} total</span>
          </div>
          <div className="space-y-4">
            {[
              { label: t('todo'), count: todoCount, color: 'bg-slate-500', percent: totalTickets > 0 ? Math.round((todoCount / totalTickets) * 100) : 0 },
              { label: t('inProgress'), count: inProgressCount, color: 'bg-blue-500', percent: inProgressPercent },
              { label: t('done'), count: doneCount, color: 'bg-emerald-500', percent: donePercent },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-sm text-slate-400">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{item.count}</span>
                </div>
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active sprint */}
        <div className="glass-card rounded-2xl p-6 animate-fade-in-up animate-delay-400">
          <h2 className="text-sm font-semibold text-white mb-4">{t('activeSprintTitle')}</h2>
          {activeSprint ? (
            <div>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse mt-1.5 shrink-0" />
                <div>
                  <p className="text-white font-semibold">{activeSprint.name}</p>
                  {activeSprint.goal && <p className="text-xs text-slate-500 mt-0.5">{activeSprint.goal}</p>}
                </div>
              </div>
              {activeSprint.endDate && (
                <div className="flex items-center gap-2 mb-4 pl-5">
                  <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-slate-600">
                    {t('ends')}: {new Date(activeSprint.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              <Link
                href={lp(`/dashboard/boards/${activeSprint.id}`)}
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                {t('openBoard')}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 mb-2">{t('noActiveSprint')}</p>
              <Link href={lp('/dashboard/boards')} className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                {t('createOne')} →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 flex-wrap animate-fade-in-up animate-delay-500">
        <Link href={lp('/dashboard/tickets/new')} className="px-5 py-2.5 btn-primary rounded-xl text-sm font-semibold inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('createTicket')}
        </Link>
        <Link href={lp('/dashboard/boards')} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-white/[0.12] text-slate-300 hover:bg-white/[0.05] hover:border-blue-500/30 transition-all inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          {t('newSprint')}
        </Link>
        <Link href={lp('/dashboard/team')} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-white/[0.12] text-slate-300 hover:bg-white/[0.05] hover:border-blue-500/30 transition-all inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          {t('inviteMember')}
        </Link>
      </div>
    </div>
  );
}
