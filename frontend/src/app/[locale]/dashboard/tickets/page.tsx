'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../lib/hooks/useAuth';
import { ticketsApi, sprintsApi, companiesApi, Ticket, TicketPriority, TicketType } from '../../../../lib/api';

function priorityBadge(p: TicketPriority) {
  const map: Record<string, string> = {
    CRITICAL: 'bg-red-500/20 border-red-500/30 text-red-300',
    HIGH: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
    MEDIUM: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
    LOW: 'bg-slate-500/20 border-slate-500/30 text-slate-400',
  };
  return map[p] || map.MEDIUM;
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    TODO: 'bg-slate-500/20 border-slate-500/30 text-slate-400',
    IN_PROGRESS: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    IN_REVIEW: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
    DONE: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
  };
  return map[s] || 'bg-purple-500/20 border-purple-500/30 text-purple-300';
}

function tagColor(tag: string) {
  const palette = [
    'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'bg-green-500/20 text-green-300 border-green-500/30',
    'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'bg-red-500/20 text-red-300 border-red-500/30',
    'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  ];
  const hash = tag.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function typeIcon(t: TicketType) {
  const map: Record<TicketType, string> = { BUG: '🐛', STORY: '📖', EPIC: '⚡', SUBTASK: '↳', TASK: '✓' };
  return map[t] || '✓';
}

export default function TicketsPage() {
  const locale = useLocale();
  const t = useTranslations('ticketsPage');
  const lp = (p: string) => locale === 'en' ? p : `/${locale}${p}`;
  const { data: auth } = useAuth();
  const qc = useQueryClient();
  const companyId = auth?.memberships?.[0]?.companyId ?? '';

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterSprint, setFilterSprint] = useState('ALL');

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets', companyId],
    queryFn: () => ticketsApi.list(companyId).then(r => r.data),
    enabled: !!companyId,
  });

  const { data: sprints } = useQuery({
    queryKey: ['sprints', companyId],
    queryFn: () => sprintsApi.list(companyId).then(r => r.data),
    enabled: !!companyId,
  });

  const { data: companyStatuses } = useQuery<string[]>({
    queryKey: ['company-statuses', companyId],
    queryFn: () => companiesApi.getStatuses(companyId).then(r => r.data),
    enabled: !!companyId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ticketsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets', companyId] }),
  });

  const filtered = (tickets ?? []).filter(ticket => {
    const q = search.toLowerCase();
    const matchSearch = !q || ticket.title.toLowerCase().includes(q) ||
      ticket.assignee?.firstName?.toLowerCase().includes(q) ||
      ticket.assignee?.lastName?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'ALL' || ticket.status === filterStatus;
    const matchPriority = filterPriority === 'ALL' || ticket.priority === filterPriority;
    const matchSprint = filterSprint === 'ALL' ||
      (filterSprint === 'BACKLOG' ? !ticket.sprint : ticket.sprint?.id === filterSprint);
    return matchSearch && matchStatus && matchPriority && matchSprint;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
        <Link href={lp('/dashboard/tickets/new')} className="px-5 py-2.5 btn-primary rounded-xl text-sm font-semibold">
          {t('createTicket')}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="input-dark flex-1 min-w-[200px]"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-dark w-36">
          <option value="ALL">{t('allStatus')}</option>
          {(companyStatuses ?? ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="input-dark w-36">
          <option value="ALL">{t('allPriority')}</option>
          <option value="CRITICAL">{t('critical')}</option>
          <option value="HIGH">{t('high')}</option>
          <option value="MEDIUM">{t('medium')}</option>
          <option value="LOW">{t('low')}</option>
        </select>
        <select value={filterSprint} onChange={e => setFilterSprint(e.target.value)} className="input-dark w-40">
          <option value="ALL">{t('allSprints')}</option>
          <option value="BACKLOG">{t('backlog')}</option>
          {(sprints as any[])?.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg mb-2">{t('noTicketsFound')}</p>
          <Link href={lp('/dashboard/tickets/new')} className="text-blue-400 hover:text-blue-300 text-sm">{t('createFirst')}</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(ticket => (
            <div key={ticket.id} className="glass-card rounded-xl px-5 py-4 flex items-center gap-4">
              <span className="text-base shrink-0">{typeIcon(ticket.type)}</span>
              <div className="flex-1 min-w-0">
                <Link href={lp(`/dashboard/tickets/${ticket.id}`)} className="text-sm font-medium text-white hover:text-blue-300 transition-colors truncate block">
                  {ticket.title}
                </Link>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {ticket.sprint && (
                    <span className="text-xs text-slate-600">{ticket.sprint.name}</span>
                  )}
                  {!ticket.sprint && (
                    <span className="text-xs text-slate-700">{t('backlog')}</span>
                  )}
                  {ticket.assignee && (
                    <span className="text-xs text-slate-500">→ {ticket.assignee.firstName} {ticket.assignee.lastName}</span>
                  )}
                  {ticket.points != null && (
                    <span className="text-xs bg-white/[0.06] px-1.5 py-0.5 rounded text-slate-400">{ticket.points}</span>
                  )}
                  {(ticket.tags ?? []).slice(0, 3).map(tag => (
                    <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${tagColor(tag)}`}>{tag}</span>
                  ))}
                </div>
              </div>
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${priorityBadge(ticket.priority)}`}>
                {ticket.priority}
              </span>
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${statusBadge(ticket.status)}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <Link href={lp(`/dashboard/tickets/${ticket.id}`)} className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5">
                {t('open')}
              </Link>
              <button onClick={() => deleteMutation.mutate(ticket.id)} className="shrink-0 text-xs px-2 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
