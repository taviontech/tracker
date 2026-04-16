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
  const myTickets = (tickets as any[])?.filter((t: any) => t.assignee?.email === auth?.user?.email) ?? [];

  const cards = [
    {
      href: lp('/dashboard/team'),
      icon: '👥',
      label: t('teamCard'),
      value: `${team?.length ?? 0} ${t('membersUnit')}`,
      color: 'from-blue-500/20 to-blue-500/20',
      border: 'border-blue-500/20',
    },
    {
      href: lp('/dashboard/boards'),
      icon: '📋',
      label: t('boardsCard'),
      value: `${sprints?.length ?? 0} ${t('sprintsUnit')}`,
      color: 'from-blue-500/20 to-blue-500/20',
      border: 'border-blue-500/20',
    },
    {
      href: lp('/dashboard/tickets'),
      icon: '🎫',
      label: t('ticketsCard'),
      value: `${tickets?.length ?? 0} ${t('totalUnit')}`,
      color: 'from-violet-500/20 to-violet-500/20',
      border: 'border-violet-500/20',
    },
    {
      href: lp('/dashboard/tickets?assignee=me'),
      icon: '✅',
      label: t('myTicketsCard'),
      value: `${myTickets.length} ${t('assignedUnit')}`,
      color: 'from-amber-500/20 to-amber-500/20',
      border: 'border-amber-500/20',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-1">{t('title')}</h1>
        <p className="text-slate-400 text-sm">
          {auth?.memberships?.[0]?.companyName} · <span className="text-blue-300">{role}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="glass-card-hover rounded-2xl p-6 group">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} border ${c.border} flex items-center justify-center text-xl mb-4`}>
              {c.icon}
            </div>
            <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors">{c.label}</h3>
            <p className="text-xs text-slate-500">{c.value}</p>
          </Link>
        ))}
      </div>

      {/* Sprint status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">{t('ticketStatusTitle')}</h2>
          <div className="space-y-3">
            {[
              { label: t('todo'), count: todoCount, color: 'bg-slate-500' },
              { label: t('inProgress'), count: inProgressCount, color: 'bg-blue-500' },
              { label: t('done'), count: doneCount, color: 'bg-blue-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-sm text-slate-400 flex-1">{item.label}</span>
                <span className="text-sm font-semibold text-white">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">{t('activeSprintTitle')}</h2>
          {activeSprint ? (
            <div>
              <p className="text-white font-medium">{activeSprint.name}</p>
              {activeSprint.goal && <p className="text-xs text-slate-500 mt-1">{activeSprint.goal}</p>}
              {activeSprint.endDate && (
                <p className="text-xs text-slate-600 mt-2">
                  {t('ends')}: {new Date(activeSprint.endDate).toLocaleDateString()}
                </p>
              )}
              <Link
                href={lp(`/dashboard/boards/${activeSprint.id}`)}
                className="mt-3 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                {t('openBoard')}
              </Link>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              {t('noActiveSprint')}{' '}
              <Link href={lp('/dashboard/boards')} className="text-blue-400 hover:text-blue-300">
                {t('createOne')}
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link href={lp('/dashboard/tickets/new')} className="px-5 py-2.5 btn-primary rounded-xl text-sm font-semibold">
          {t('createTicket')}
        </Link>
        <Link href={lp('/dashboard/boards')} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-white/[0.12] text-slate-300 hover:bg-white/[0.05] transition-all">
          {t('newSprint')}
        </Link>
        <Link href={lp('/dashboard/team')} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-white/[0.12] text-slate-300 hover:bg-white/[0.05] transition-all">
          {t('inviteMember')}
        </Link>
      </div>
    </div>
  );
}
