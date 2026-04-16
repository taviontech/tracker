'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../../lib/hooks/useAuth';
import { ticketsApi, sprintsApi, teamApi } from '../../../../../lib/api';

function NewTicketContent() {
  const locale = useLocale();
  const t = useTranslations('newTicketPage');
  const lp = (p: string) => locale === 'en' ? p : `/${locale}${p}`;
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultSprintId = searchParams.get('sprintId') ?? '';
  const qc = useQueryClient();
  const { data: auth } = useAuth();
  const companyId = auth?.memberships?.[0]?.companyId ?? '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('TASK');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('TODO');
  const [points, setPoints] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [sprintId, setSprintId] = useState(defaultSprintId);
  const [error, setError] = useState('');

  const { data: sprints } = useQuery({
    queryKey: ['sprints', companyId],
    queryFn: () => sprintsApi.list(companyId).then(r => r.data),
    enabled: !!companyId,
  });

  const { data: team } = useQuery({
    queryKey: ['team', companyId],
    queryFn: () => teamApi.getTeam(companyId).then(r => r.data),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: () => ticketsApi.create(companyId, {
      title,
      description: description || undefined,
      type,
      priority,
      status,
      points: points ? parseInt(points) : undefined,
      assigneeId: assigneeId || undefined,
      sprintId: sprintId || undefined,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      router.push(lp(`/dashboard/tickets/${res.data.id}`));
    },
    onError: (e: any) => setError(e?.response?.data?.message || t('errorDefault')),
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Link href={lp('/dashboard/tickets')} className="text-slate-500 hover:text-slate-300 text-sm">{t('backLink')}</Link>
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">{t('titleLabel')}</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            className="input-dark w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">{t('descriptionLabel')}</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            rows={5}
            className="input-dark w-full resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">{t('typeLabel')}</label>
            <select value={type} onChange={e => setType(e.target.value)} className="input-dark w-full">
              <option value="TASK">{t('typeTask')}</option>
              <option value="BUG">{t('typeBug')}</option>
              <option value="STORY">{t('typeStory')}</option>
              <option value="EPIC">{t('typeEpic')}</option>
              <option value="SUBTASK">{t('typeSubtask')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">{t('priorityLabel')}</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="input-dark w-full">
              <option value="LOW">{t('priorityLow')}</option>
              <option value="MEDIUM">{t('priorityMedium')}</option>
              <option value="HIGH">{t('priorityHigh')}</option>
              <option value="CRITICAL">{t('priorityCritical')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">{t('statusLabel')}</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="input-dark w-full">
              <option value="TODO">{t('statusTodo')}</option>
              <option value="IN_PROGRESS">{t('statusInProgress')}</option>
              <option value="IN_REVIEW">{t('statusInReview')}</option>
              <option value="DONE">{t('statusDone')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">{t('storyPointsLabel')}</label>
            <input
              type="number"
              value={points}
              onChange={e => setPoints(e.target.value)}
              placeholder="0"
              min="0"
              className="input-dark w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">{t('assigneeLabel')}</label>
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="input-dark w-full">
              <option value="">{t('unassigned')}</option>
              {(team as any[])?.filter((m: any) => m.active).map((m: any) => (
                <option key={m.userId} value={m.userId}>
                  {m.firstName} {m.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">{t('sprintLabel')}</label>
            <select value={sprintId} onChange={e => setSprintId(e.target.value)} className="input-dark w-full">
              <option value="">{t('backlog')}</option>
              {(sprints as any[])?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">⚠ {error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => createMutation.mutate()}
            disabled={!title || createMutation.isPending}
            className="px-5 py-2.5 btn-primary rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {createMutation.isPending ? t('creating') : t('createBtn')}
          </button>
          <Link href={lp('/dashboard/tickets')} className="px-5 py-2.5 rounded-xl text-sm text-slate-400 border border-white/10 hover:bg-white/5">
            {t('cancel')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function NewTicketPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <NewTicketContent />
    </Suspense>
  );
}
