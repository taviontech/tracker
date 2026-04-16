'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../lib/hooks/useAuth';
import { ticketsApi, sprintsApi, Ticket } from '../../../../lib/api';

function priorityColor(p: string) {
  if (p === 'CRITICAL') return 'text-red-500';
  if (p === 'HIGH') return 'text-red-400';
  if (p === 'MEDIUM') return 'text-amber-400';
  return 'text-slate-400';
}

function CreateSprintModal({ companyId, onClose }: { companyId: string; onClose: () => void }) {
  const t = useTranslations('backlogPage');
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const create = useMutation({
    mutationFn: () => sprintsApi.create(companyId, {
      name: name.trim(),
      goal: goal.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', companyId] });
      onClose();
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h2 className="text-base font-semibold text-white">{t('createSprint')}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1.5">
              {t('sprintNameLabel')} <span className="text-red-400">*</span>
            </label>
            <input
              ref={nameRef}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="input-dark w-full text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1.5">
              {t('sprintGoalLabel')} <span className="text-slate-600">({t('optional')})</span>
            </label>
            <input
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder={t('goalPlaceholder')}
              className="input-dark w-full text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">{t('startDate')}</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="input-dark w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">{t('endDate')}</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="input-dark w-full text-sm"
              />
            </div>
          </div>

          {create.isError && (
            <p className="text-xs text-red-400">{t('createError')}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={!name.trim() || create.isPending}
              className="flex-1 py-2 btn-primary rounded-xl text-sm font-semibold disabled:opacity-40"
            >
              {create.isPending ? t('creating') : t('createSprint')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-white/10 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BacklogPage() {
  const t = useTranslations('backlogPage');
  const locale = useLocale();
  const lp = (p: string) => locale === 'en' ? p : `/${locale}${p}`;
  const { data: auth } = useAuth();
  const companyId = auth?.memberships?.[0]?.companyId ?? '';
  const role = auth?.memberships?.[0]?.role;
  const canManage = role === 'OWNER' || role === 'CO_OWNER' || role === 'MANAGER';
  const [search, setSearch] = useState('');
  const [showCreateSprint, setShowCreateSprint] = useState(false);

  const { data: backlogTickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets', 'backlog', companyId],
    queryFn: () => ticketsApi.list(companyId, undefined, true).then(r => r.data),
    enabled: !!companyId,
  });

  const items = (backlogTickets ?? []).filter(t =>
    !search ||
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.ticketKey ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
          </div>
          {backlogTickets && (
            <p className="text-slate-500 text-sm pl-5">{backlogTickets.length} tickets</p>
          )}
        </div>
        {canManage && (
          <button onClick={() => setShowCreateSprint(true)} className="px-4 py-2 btn-primary rounded-xl text-sm font-semibold inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('createSprint')}
          </button>
        )}
      </div>

      <div className="relative max-w-xs mb-5 animate-fade-in-up animate-delay-100">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('search')}
          className="input-dark w-full pl-8 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-blue-500/30 rounded-full" />
            <div className="absolute inset-0 w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg mb-2">{search ? t('noResults') : t('empty')}</p>
          {!search && <p className="text-sm">{t('emptyHint')}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(ticket => (
            <Link
              key={ticket.id}
              href={lp(`/dashboard/tickets/${ticket.id}`)}
              className="glass-card rounded-xl px-5 py-3 flex items-center gap-4 hover:border-white/20 transition-all"
            >
              <span className="font-mono text-xs text-slate-500 shrink-0 w-24">{ticket.ticketKey}</span>
              <span className="text-sm text-white flex-1 truncate">{ticket.title}</span>
              <span className={`text-xs shrink-0 ${priorityColor(ticket.priority)}`}>{ticket.priority}</span>
              {ticket.assignee ? (
                <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs text-blue-300 font-bold shrink-0" title={`${ticket.assignee.firstName} ${ticket.assignee.lastName}`}>
                  {ticket.assignee.firstName[0]}
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-700/60 border border-slate-600/50 flex items-center justify-center shrink-0" title={t('unassigned')}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {showCreateSprint && (
        <CreateSprintModal
          companyId={companyId}
          onClose={() => setShowCreateSprint(false)}
        />
      )}
    </div>
  );
}
