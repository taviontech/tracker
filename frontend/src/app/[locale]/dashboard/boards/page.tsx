'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../lib/hooks/useAuth';
import { sprintsApi, Sprint, SprintStatus } from '../../../../lib/api';

function statusColor(status: string) {
  if (status === 'ACTIVE')    return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
  if (status === 'PAUSED')    return 'bg-amber-500/20 border-amber-500/30 text-amber-300';
  if (status === 'COMPLETED') return 'bg-slate-500/20 border-slate-500/30 text-slate-400';
  return 'bg-violet-500/20 border-violet-500/30 text-violet-300';
}

const STATUS_FILTER_KEYS: Array<{ value: SprintStatus | 'ALL'; labelKey: string }> = [
  { value: 'ALL',       labelKey: 'filterAll' },
  { value: 'PLANNING',  labelKey: 'filterPlanning' },
  { value: 'ACTIVE',    labelKey: 'filterActive' },
  { value: 'PAUSED',    labelKey: 'filterPaused' },
  { value: 'COMPLETED', labelKey: 'filterCompleted' },
];

export default function BoardsPage() {
  const locale = useLocale();
  const t = useTranslations('boardsListPage');
  const lp = (p: string) => locale === 'en' ? p : `/${locale}${p}`;
  const router = useRouter();
  const { data: auth } = useAuth();
  const qc = useQueryClient();
  const companyId = auth?.memberships?.[0]?.companyId ?? '';
  const role = auth?.memberships?.[0]?.role;

  const [statusFilter, setStatusFilter] = useState<SprintStatus | 'ALL'>('ALL');
  const [sprintSearch, setSprintSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [redirected, setRedirected] = useState(false);

  const { data: sprints, isLoading } = useQuery<Sprint[]>({
    queryKey: ['sprints', companyId],
    queryFn: () => sprintsApi.list(companyId).then(r => r.data),
    enabled: !!companyId,
  });

  // Redirect to active sprint if one exists
  useEffect(() => {
    if (!sprints || redirected) return;
    const active = sprints.find(s => s.status === 'ACTIVE');
    if (active) {
      setRedirected(true);
      router.replace(lp(`/dashboard/boards/${active.id}`));
    }
  }, [sprints]);

  const createMutation = useMutation({
    mutationFn: () => sprintsApi.create(companyId, { name, goal, startDate: startDate || undefined, endDate: endDate || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', companyId] });
      setShowForm(false);
      setName(''); setGoal(''); setStartDate(''); setEndDate('');
    },
    onError: (e: any) => setError(e?.response?.data?.message || t('errorDefault')),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => sprintsApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints', companyId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sprintsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints', companyId] }),
  });

  const canManage = role === 'OWNER' || role === 'CO_OWNER' || role === 'MANAGER';

  const filtered = (sprints ?? []).filter(s => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (sprintSearch) {
      const q = sprintSearch.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !(s.goal ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Show spinner while loading or while redirecting to active sprint
  if (isLoading || (sprints && sprints.some(s => s.status === 'ACTIVE') && !redirected)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
        {canManage && (
          <button onClick={() => setShowForm(!showForm)} className="px-5 py-2.5 btn-primary rounded-xl text-sm font-semibold">
            {t('newSprint')}
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">{t('createSprintTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('sprintNamePlaceholder')} className="input-dark w-full" />
            </div>
            <div className="md:col-span-2">
              <input type="text" value={goal} onChange={e => setGoal(e.target.value)} placeholder={t('sprintGoalPlaceholder')} className="input-dark w-full" />
            </div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-dark w-full" />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-dark w-full" />
          </div>
          {error && <p className="mt-2 text-sm text-red-400">⚠ {error}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending} className="px-5 py-2 btn-primary rounded-xl text-sm font-semibold disabled:opacity-50">
              {createMutation.isPending ? t('creating') : t('createSprintBtn')}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl text-sm text-slate-400 border border-white/10 hover:bg-white/5">
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Status filter + search */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTER_KEYS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                statusFilter === f.value
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                  : 'border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-300'
              }`}
            >
              {t(f.labelKey as any)}
              {f.value !== 'ALL' && sprints && (
                <span className="ml-1 opacity-60">({sprints.filter(s => s.status === f.value).length})</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={sprintSearch}
            onChange={e => setSprintSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="input-dark w-full pl-8 text-sm"
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(sprint => (
            <div key={sprint.id} className="glass-card rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <Link href={lp(`/dashboard/boards/${sprint.id}`)} className="text-sm font-semibold text-white hover:text-blue-300 transition-colors">
                    {sprint.name}
                  </Link>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(sprint.status)}`}>
                    {sprint.status}
                  </span>
                </div>
                {sprint.goal && <p className="text-xs text-slate-500 truncate">{sprint.goal}</p>}
                {(sprint.startDate || sprint.endDate) && (
                  <p className="text-xs text-slate-600 mt-1">
                    {sprint.startDate && `${t('sprintStart')}: ${new Date(sprint.startDate).toLocaleDateString()}`}
                    {sprint.startDate && sprint.endDate && ' · '}
                    {sprint.endDate && `${t('sprintEnd')}: ${new Date(sprint.endDate).toLocaleDateString()}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <Link href={lp(`/dashboard/boards/${sprint.id}`)} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-all">
                  {t('openBoard')}
                </Link>
                {canManage && sprint.status === 'PLANNING' && (
                  <button onClick={() => updateStatus.mutate({ id: sprint.id, status: 'ACTIVE' })} className="text-xs px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                    {t('start')}
                  </button>
                )}
                {canManage && sprint.status === 'ACTIVE' && (
                  <>
                    <button onClick={() => updateStatus.mutate({ id: sprint.id, status: 'PAUSED' })} className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                      {t('pause')}
                    </button>
                    <button onClick={() => updateStatus.mutate({ id: sprint.id, status: 'COMPLETED' })} className="text-xs px-3 py-1.5 rounded-lg border border-slate-500/30 text-slate-400 hover:bg-slate-500/10">
                      {t('complete')}
                    </button>
                  </>
                )}
                {canManage && sprint.status === 'PAUSED' && (
                  <button onClick={() => updateStatus.mutate({ id: sprint.id, status: 'ACTIVE' })} className="text-xs px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                    {t('resume')}
                  </button>
                )}
                {canManage && (
                  <button onClick={() => deleteMutation.mutate(sprint.id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10">
                    {t('delete')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg mb-2">{statusFilter === 'ALL' ? t('noSprintsYet') : t('noFilterSprints')}</p>
          {statusFilter === 'ALL' && <p className="text-sm">{t('createFirst')}</p>}
        </div>
      )}
    </div>
  );
}
