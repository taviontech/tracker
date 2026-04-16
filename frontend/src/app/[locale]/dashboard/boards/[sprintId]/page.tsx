'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../../lib/hooks/useAuth';
import { sprintsApi, ticketsApi, teamApi, Ticket } from '../../../../../lib/api';

const DEFAULT_COLUMNS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const MAX_COLUMNS = 6;

// 6 distinct colors by column index
const COL_PALETTE = [
  { border: 'border-blue-500/40',    text: 'text-blue-400' },
  { border: 'border-violet-500/40',  text: 'text-violet-400' },
  { border: 'border-amber-500/40',   text: 'text-amber-400' },
  { border: 'border-emerald-500/40', text: 'text-emerald-400' },
  { border: 'border-red-500/40',     text: 'text-red-400' },
  { border: 'border-cyan-500/40',    text: 'text-cyan-400' },
];

function colStyle(idx: number) {
  return COL_PALETTE[idx % COL_PALETTE.length];
}

// Statuses displayed in English only (not translated)
function columnLabel(col: string) {
  const labels: Record<string, string> = {
    TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done',
  };
  return labels[col] ?? col.replace(/_/g, ' ');
}

// ── Priority icon ─────────────────────────────────────────────────────────────
function PriorityIcon({ priority }: { priority: string }) {
  const arrow = <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor"><path d="M4 0L7.46 5H.54L4 0Z"/></svg>;
  if (priority === 'LOW') return <span title="Low" className="flex items-center text-blue-400">{arrow}</span>;
  if (priority === 'MEDIUM') return <span title="Medium" className="flex items-center gap-px text-yellow-400">{arrow}{arrow}</span>;
  if (priority === 'HIGH') return <span title="High" className="flex items-center gap-px text-red-400">{arrow}{arrow}{arrow}</span>;
  return (
    <span title="Critical" className="flex items-center text-red-500">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        <circle cx="5" cy="5" r="5"/>
        <rect x="4.2" y="2" width="1.6" height="3.8" rx="0.8" fill="white"/>
        <circle cx="5" cy="7.5" r="0.9" fill="white"/>
      </svg>
    </span>
  );
}

function TypeIcon({ type }: { type: string }) {
  if (type === 'BUG') return (
    <span className="w-4 h-4 rounded-sm bg-red-500/25 border border-red-500/40 flex items-center justify-center shrink-0" title="Bug">
      <svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor" className="text-red-400"><circle cx="6" cy="6" r="5"/><path d="M4 4l4 4M8 4l-4 4" stroke="#fff" strokeWidth="1.5" fill="none"/></svg>
    </span>
  );
  if (type === 'STORY') return (
    <span className="w-4 h-4 rounded-sm bg-green-500/25 border border-green-500/40 flex items-center justify-center shrink-0" title="Story">
      <svg width="8" height="9" viewBox="0 0 10 11" fill="none" className="text-green-400"><path d="M2 1h6a1 1 0 011 1v8L5 8 2 10V2a1 1 0 010-1z" fill="currentColor"/></svg>
    </span>
  );
  if (type === 'EPIC') return (
    <span className="w-4 h-4 rounded-sm bg-purple-500/25 border border-purple-500/40 flex items-center justify-center shrink-0" title="Epic">
      <svg width="7" height="10" viewBox="0 0 7 11" fill="currentColor" className="text-purple-400"><path d="M4 0L0 6h3L2 11l5-7H4L5 0z"/></svg>
    </span>
  );
  if (type === 'SUBTASK') return (
    <span className="w-4 h-4 rounded-sm bg-sky-500/20 border border-sky-500/35 flex items-center justify-center shrink-0" title="Subtask">
      <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sky-400"><rect x="1" y="1" width="8" height="8" rx="1.5"/><path d="M3.5 5h3M5 3.5v3"/></svg>
    </span>
  );
  return (
    <span className="w-4 h-4 rounded-sm bg-blue-500/25 border border-blue-500/40 flex items-center justify-center shrink-0" title="Task">
      <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400"><polyline points="2,5 4.5,7.5 8.5,2.5"/></svg>
    </span>
  );
}

function daysInProgress(ticket: Ticket): number | null {
  const since = ticket.inProgressAt ?? (ticket.status === 'IN_PROGRESS' ? ticket.updatedAt : null);
  if (!since) return null;
  return Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000);
}

function TimeInProgressDot({ days }: { days: number }) {
  let color = 'bg-emerald-400', label = 'Less than a day';
  if (days >= 7)      { color = 'bg-red-500';    label = `${days} days in progress`; }
  else if (days >= 3) { color = 'bg-orange-400'; label = `${days} days in progress`; }
  else if (days >= 1) { color = 'bg-amber-400';  label = `${days} day${days > 1 ? 's' : ''} in progress`; }
  return <span title={label} className={`w-2 h-2 rounded-full ${color} shrink-0 animate-pulse`} />;
}

function UnassignedAvatar({ size = 6 }: { size?: number }) {
  const sz = size === 5 ? 'w-5 h-5' : 'w-6 h-6';
  return (
    <div className={`${sz} rounded-full bg-slate-700/60 border border-slate-600/50 flex items-center justify-center shrink-0`} title="Unassigned">
      <svg width={size === 5 ? 10 : 12} height={size === 5 ? 10 : 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
  );
}

function tagColor(tag: string) {
  const palette = [
    'bg-blue-500/20 text-blue-300 border-blue-500/30', 'bg-green-500/20 text-green-300 border-green-500/30',
    'bg-purple-500/20 text-purple-300 border-purple-500/30', 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'bg-red-500/20 text-red-300 border-red-500/30', 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    'bg-pink-500/20 text-pink-300 border-pink-500/30',
  ];
  const hash = tag.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

const SAFE_COLORS: Record<string, string> = {
  red: '#f87171', orange: '#fb923c', yellow: '#fbbf24', green: '#4ade80',
  blue: '#60a5fa', purple: '#c084fc', pink: '#f472b6', gray: '#94a3b8',
};
function renderMd(raw: string) {
  const esc = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc
    .replace(/^### (.+)$/gm, '<span class="block font-semibold mt-2 mb-1 text-sm" style="color:#e2e8f0">$1</span>')
    .replace(/^## (.+)$/gm, '<span class="block font-semibold mt-2 mb-1 text-base" style="color:#f1f5f9">$1</span>')
    .replace(/^# (.+)$/gm, '<span class="block font-bold mt-3 mb-1 text-lg" style="color:#f8fafc">$1</span>')
    .replace(/^> (.+)$/gm, '<span class="block ml-4 pl-3 border-l-2 border-slate-600 text-slate-400 italic">$1</span>')
    .replace(/^(\d+)\. (.+)$/gm, '<span class="block ml-4"><span class="text-slate-500 mr-2">$1.</span>$2</span>')
    .replace(/^- (.+)$/gm, '<span class="block ml-4 before:content-[\'•\'] before:mr-2 before:text-slate-500">$1</span>')
    .replace(/\[([a-z]+)\]([^\[]*)\[\/\1\]/g, (_, color, text) => { const hex = SAFE_COLORS[color]; return hex ? `<span style="color:${hex}">${text}</span>` : text; })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>').replace(/__([^_]+)__/g, '<u>$1</u>')
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 rounded font-mono text-blue-300 text-[0.85em]">$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer noopener" class="text-blue-400 underline">$1</a>')
    .replace(/\n/g, '<br>');
}

// ── Ticket modal ──────────────────────────────────────────────────────────────
function TicketModal({ ticket, onClose, lp, t }: {
  ticket: Ticket; onClose: () => void; lp: (p: string) => string; t: (k: string) => string;
}) {
  const days = daysInProgress(ticket);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-2xl flex flex-col shadow-2xl max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] sticky top-0 bg-slate-900 z-10 rounded-t-2xl">
          <span className="font-mono text-xs text-slate-500">{ticket.ticketKey}</span>
          <div className="flex items-center gap-3">
            <Link href={lp(`/dashboard/tickets/${ticket.id}`)} className="text-xs px-3 py-1.5 btn-primary rounded-lg font-semibold" onClick={onClose}>{t('openTicket')}</Link>
            <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">×</button>
          </div>
        </div>
        <div className="px-5 py-5 space-y-4 flex-1">
          <div className="flex items-start gap-2">
            <TypeIcon type={ticket.type} />
            <h2 className="text-base font-semibold text-white leading-snug">{ticket.title}</h2>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-white/[0.06] text-slate-400">
              <PriorityIcon priority={ticket.priority} />{ticket.priority}
            </span>
            {(ticket.tags ?? []).map(tag => (
              <span key={tag} className={`text-xs px-2 py-0.5 rounded-full border ${tagColor(tag)}`}>{tag}</span>
            ))}
            {days !== null && ticket.status === 'IN_PROGRESS' && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <TimeInProgressDot days={days} />{days === 0 ? '< 1 day' : `${days}d in progress`}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold mb-1">{t('statusLabel')}</p>
              <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${
                ticket.status === 'DONE' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' :
                ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' :
                ticket.status === 'IN_REVIEW' ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' :
                'bg-slate-500/20 border-slate-500/30 text-slate-300'
              }`}>{columnLabel(ticket.status)}</span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold mb-1">{t('assigneeLabel')}</p>
              {ticket.assignee ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[9px] text-blue-300 font-bold shrink-0">{ticket.assignee.firstName[0]}</div>
                  <span className="text-xs text-slate-300">{ticket.assignee.firstName} {ticket.assignee.lastName}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5"><UnassignedAvatar size={5} /><span className="text-xs text-slate-600">{t('unassigned')}</span></div>
              )}
            </div>
            {ticket.sprint && <div><p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold mb-1">{t('sprintLabel')}</p><span className="text-xs text-slate-400">{ticket.sprint.name}</span></div>}
            {ticket.points != null && <div><p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold mb-1">{t('storyPoints')}</p><span className="text-xs text-slate-300">{ticket.points}</span></div>}
            {ticket.reporter && <div><p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold mb-1">{t('reporterLabel')}</p><span className="text-xs text-slate-400">{ticket.reporter.firstName} {ticket.reporter.lastName}</span></div>}
            <div><p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold mb-1">{t('createdLabel')}</p><span className="text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span></div>
          </div>
          {ticket.description && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold mb-2">{t('descriptionLabel')}</p>
              <div className="text-sm text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMd(ticket.description) }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BoardPage() {
  const t = useTranslations('boardPage');
  const params = useParams();
  const sprintId = params.sprintId as string;
  const locale = useLocale();
  const lp = (p: string) => locale === 'en' ? p : `/${locale}${p}`;
  const { data: auth } = useAuth();
  const qc = useQueryClient();
  const companyId = auth?.memberships?.[0]?.companyId ?? '';
  const router = useRouter();
  const role = auth?.memberships?.[0]?.role;
  const canManage = role === 'OWNER' || role === 'CO_OWNER' || role === 'MANAGER';

  // Ticket drag
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  // Column drag-to-reorder
  const [draggingCol, setDraggingCol] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const dragTypeRef = useRef<'ticket' | 'column'>('ticket');

  const [assigneeFilters, setAssigneeFilters] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sprintSelectorOpen, setSprintSelectorOpen] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [confirmDeleteCol, setConfirmDeleteCol] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const sprintSelectorRef = useRef<HTMLDivElement>(null);
  const newColumnInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    const h = (e: MouseEvent) => { if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [filterOpen]);

  useEffect(() => {
    if (!sprintSelectorOpen) return;
    const h = (e: MouseEvent) => { if (sprintSelectorRef.current && !sprintSelectorRef.current.contains(e.target as Node)) setSprintSelectorOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [sprintSelectorOpen]);

  useEffect(() => { if (addingColumn) newColumnInputRef.current?.focus(); }, [addingColumn]);

  const { data: sprints } = useQuery({
    queryKey: ['sprints', companyId],
    queryFn: () => sprintsApi.list(companyId).then(r => r.data),
    enabled: !!companyId,
  });

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets', 'sprint', sprintId],
    queryFn: () => ticketsApi.list(companyId, sprintId).then(r => r.data),
    enabled: !!sprintId && !!companyId,
  });

  const { data: team } = useQuery({
    queryKey: ['team', companyId],
    queryFn: () => teamApi.getTeam(companyId).then(r => r.data),
    enabled: !!companyId,
  });

  const updateTicketStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ticketsApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets', 'sprint', sprintId] }),
  });

  const updateSprintStatus = useMutation({
    mutationFn: (status: string) => sprintsApi.updateStatus(sprintId, status),
    onSuccess: (_, status) => {
      qc.invalidateQueries({ queryKey: ['sprints', companyId] });
      setConfirmComplete(false);
      if (status === 'COMPLETED') router.replace(lp('/dashboard/boards'));
    },
  });

  const updateColumns = useMutation({
    mutationFn: (columns: string[]) => sprintsApi.updateColumns(sprintId, columns),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', companyId] });
      qc.invalidateQueries({ queryKey: ['company-statuses', companyId] });
      qc.invalidateQueries({ queryKey: ['tickets', 'sprint', sprintId] });
    },
  });

  const sprint = (sprints as any[])?.find((s: any) => s.id === sprintId);
  const sprintColumns: string[] = sprint?.columns ?? DEFAULT_COLUMNS;
  const isReadOnly = sprint?.status === 'PAUSED' || sprint?.status === 'COMPLETED';
  const showAddCard = canManage && sprint?.status === 'ACTIVE' && sprintColumns.length < MAX_COLUMNS;
  const totalGridCols = sprintColumns.length + (showAddCard ? 1 : 0);

  function handleTicketDrop(status: string) {
    if (!dragging || isReadOnly || dragTypeRef.current !== 'ticket') return;
    updateTicketStatus.mutate({ id: dragging, status });
    setDragging(null);
    setDragOver(null);
  }

  function handleColDrop(targetCol: string) {
    if (!draggingCol || dragTypeRef.current !== 'column') return;
    if (draggingCol === targetCol) { setDraggingCol(null); setDragOverCol(null); return; }
    const cols = [...sprintColumns];
    const from = cols.indexOf(draggingCol);
    const to = cols.indexOf(targetCol);
    if (from < 0 || to < 0) return;
    cols.splice(from, 1);
    cols.splice(to, 0, draggingCol);
    updateColumns.mutate(cols);
    setDraggingCol(null);
    setDragOverCol(null);
  }

  function addColumn() {
    const key = newColumnName.trim().toUpperCase().replace(/\s+/g, '_');
    if (!key || sprintColumns.includes(key)) return;
    updateColumns.mutate([...sprintColumns, key]);
    setNewColumnName('');
    setAddingColumn(false);
  }

  function removeColumn(col: string) {
    if (confirmDeleteCol !== col) { setConfirmDeleteCol(col); return; }
    updateColumns.mutate(sprintColumns.filter(c => c !== col));
    setConfirmDeleteCol(null);
  }

  function toggleFilter(id: string) {
    setAssigneeFilters(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const allTickets = tickets ?? [];
  const assigneesInSprint = [...new Map(allTickets.filter(t => t.assignee).map(t => [t.assignee!.id, t.assignee!])).values()];
  const filteredTickets = assigneeFilters.length === 0 ? allTickets : allTickets.filter(t => {
    if (assigneeFilters.includes('UNASSIGNED') && !t.assignee) return true;
    if (t.assignee && assigneeFilters.includes(t.assignee.id)) return true;
    return false;
  });
  const ticketsByStatus = (status: string) => filteredTickets.filter(t => t.status === status);

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-0" ref={sprintSelectorRef}>
          <button onClick={() => setSprintSelectorOpen(v => !v)} className="flex items-center gap-2 group max-w-full">
            <h1 className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors truncate">
              {sprint?.name ?? t('sprintBoard')}
            </h1>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className={`text-slate-500 group-hover:text-blue-400 transition-transform shrink-0 ${sprintSelectorOpen ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {sprint?.goal && <p className="text-sm text-slate-500 mt-0.5">{sprint.goal}</p>}

          {sprintSelectorOpen && (
            <div className="absolute top-full left-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-30 min-w-[280px] py-1.5 max-h-72 overflow-y-auto">
              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold px-4 pt-1.5 pb-1">{t('sprints')}</p>
              {(sprints as any[])?.slice().sort((a: any, b: any) => {
                const order: Record<string, number> = { ACTIVE: 0, PLANNING: 1, PAUSED: 2, COMPLETED: 3 };
                return (order[a.status] ?? 9) - (order[b.status] ?? 9);
              }).map((s: any) => (
                <button key={s.id} onClick={() => { setSprintSelectorOpen(false); router.push(lp(`/dashboard/boards/${s.id}`)); }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left transition-colors ${s.id === sprintId ? 'bg-blue-500/10 text-blue-300' : 'text-slate-300 hover:bg-white/[0.05]'}`}>
                  <span className="truncate">{s.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${
                    s.status === 'ACTIVE' ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' :
                    s.status === 'PAUSED' ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' :
                    s.status === 'COMPLETED' ? 'bg-slate-500/20 border-slate-500/30 text-slate-400' :
                    'bg-violet-500/20 border-violet-500/30 text-violet-300'
                  }`}>{s.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {sprint && (
          <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
            sprint.status === 'ACTIVE' ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' :
            sprint.status === 'PAUSED' ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' :
            sprint.status === 'COMPLETED' ? 'bg-slate-500/20 border-slate-500/30 text-slate-400' :
            'bg-violet-500/20 border-violet-500/30 text-violet-300'
          }`}>{sprint.status}</span>
        )}

        {canManage && sprint?.status === 'ACTIVE' && (
          <>
            <button onClick={() => updateSprintStatus.mutate('PAUSED')} disabled={updateSprintStatus.isPending}
              className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50 shrink-0">
              {t('pauseSprint')}
            </button>
            {confirmComplete ? (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400">{t('completeSprint')}</span>
                <button onClick={() => updateSprintStatus.mutate('COMPLETED')} disabled={updateSprintStatus.isPending}
                  className="text-xs px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50">
                  {updateSprintStatus.isPending ? '...' : t('yesComplete')}
                </button>
                <button onClick={() => setConfirmComplete(false)} className="text-xs px-2 py-1.5 text-slate-500 hover:text-slate-300">{t('cancel')}</button>
              </div>
            ) : (
              <button onClick={() => setConfirmComplete(true)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-500/30 text-slate-400 hover:bg-slate-500/10 transition-colors shrink-0">
                {t('complete')}
              </button>
            )}
          </>
        )}
        {canManage && sprint?.status === 'PAUSED' && (
          <button onClick={() => updateSprintStatus.mutate('ACTIVE')} disabled={updateSprintStatus.isPending}
            className="text-xs px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50 shrink-0">
            {t('resume')}
          </button>
        )}
        {!isReadOnly && (
          <Link href={lp(`/dashboard/tickets/new?sprintId=${sprintId}`)} className="px-4 py-2 btn-primary rounded-xl text-sm font-semibold shrink-0">
            {t('addTicket')}
          </Link>
        )}
      </div>

      {isReadOnly && (
        <div className={`mb-5 px-4 py-3 rounded-xl border text-sm flex items-center gap-2 ${
          sprint?.status === 'PAUSED' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
        }`}>
          {sprint?.status === 'PAUSED' ? t('pausedBanner') : t('completedBanner')}
        </div>
      )}

      {/* Assignee filter */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span className="text-xs text-slate-500">{t('filterLabel')}</span>
        <div className="relative" ref={filterRef}>
          <button onClick={() => setFilterOpen(v => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${assigneeFilters.length > 0 ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>
            {assigneeFilters.length === 0 ? t('allAssignees') : `${assigneeFilters.length} ${t('selected')}`}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {filterOpen && (
            <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-20 min-w-[210px] py-1.5">
              <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.05] cursor-pointer text-xs text-slate-300">
                <input type="checkbox" checked={assigneeFilters.includes('UNASSIGNED')} onChange={() => toggleFilter('UNASSIGNED')} className="rounded accent-blue-500" />
                <UnassignedAvatar size={5} />{t('unassigned')}
              </label>
              {assigneesInSprint.map(a => (
                <label key={a.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.05] cursor-pointer text-xs text-slate-300">
                  <input type="checkbox" checked={assigneeFilters.includes(a.id)} onChange={() => toggleFilter(a.id)} className="rounded accent-blue-500" />
                  <div className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center text-[9px] font-bold text-blue-300 shrink-0">{a.firstName[0]}</div>
                  {a.firstName} {a.lastName}
                </label>
              ))}
              {assigneeFilters.length > 0 && (
                <><div className="border-t border-white/[0.07] my-1" />
                  <button onClick={() => { setAssigneeFilters([]); setFilterOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-colors">{t('clearAll')}</button>
                </>
              )}
            </div>
          )}
        </div>
        {assigneeFilters.map(f => {
          const person = f === 'UNASSIGNED' ? null : assigneesInSprint.find(a => a.id === f);
          return (
            <span key={f} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300">
              {f === 'UNASSIGNED' ? t('unassigned') : `${person?.firstName} ${person?.lastName}`}
              <button onClick={() => toggleFilter(f)} className="ml-0.5 hover:text-white leading-none">×</button>
            </span>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid gap-4 w-full" style={{ gridTemplateColumns: `repeat(${totalGridCols}, minmax(0, 1fr))` }}>
          {sprintColumns.map((col, idx) => {
            const style = colStyle(idx);
            const isColDragTarget = dragOverCol === col && draggingCol !== col;
            return (
              <div
                key={col}
                className={`rounded-xl border ${style.border} ${dragOver === col && dragTypeRef.current === 'ticket' ? 'bg-white/[0.04]' : 'bg-white/[0.01]'} ${isColDragTarget ? 'ring-2 ring-blue-500/40' : ''} ${draggingCol === col ? 'opacity-50' : ''} transition-all`}
                onDragOver={e => {
                  e.preventDefault();
                  if (dragTypeRef.current === 'ticket' && !isReadOnly) setDragOver(col);
                  else if (dragTypeRef.current === 'column') setDragOverCol(col);
                }}
                onDragLeave={() => { setDragOver(null); setDragOverCol(null); }}
                onDrop={() => {
                  if (dragTypeRef.current === 'ticket') handleTicketDrop(col);
                  else handleColDrop(col);
                }}
              >
                {/* Column header */}
                <div className="px-3 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between gap-1">
                    {/* Drag handle for columns */}
                    {canManage && sprint?.status === 'ACTIVE' && (
                      <div
                        draggable
                        onDragStart={e => { e.stopPropagation(); dragTypeRef.current = 'column'; setDraggingCol(col); }}
                        onDragEnd={() => { setDraggingCol(null); setDragOverCol(null); }}
                        className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 shrink-0 px-0.5"
                        title="Drag to reorder"
                      >
                        <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
                          <circle cx="3" cy="2" r="1.2"/><circle cx="7" cy="2" r="1.2"/>
                          <circle cx="3" cy="6" r="1.2"/><circle cx="7" cy="6" r="1.2"/>
                          <circle cx="3" cy="10" r="1.2"/><circle cx="7" cy="10" r="1.2"/>
                        </svg>
                      </div>
                    )}
                    <span className={`text-xs font-semibold uppercase tracking-wider flex-1 ${style.text}`}>{columnLabel(col)}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-slate-600">{ticketsByStatus(col).length}</span>
                      {canManage && sprint?.status === 'ACTIVE' && (
                        confirmDeleteCol === col ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => { updateColumns.mutate(sprintColumns.filter(c => c !== col)); setConfirmDeleteCol(null); }}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                              ✓
                            </button>
                            <button onClick={() => setConfirmDeleteCol(null)} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 hover:bg-white/10 transition-colors">×</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeleteCol(col)} disabled={updateColumns.isPending}
                            title={t('removeColumn')}
                            className="text-slate-600 hover:text-red-400 transition-colors leading-none text-base disabled:opacity-40">
                            ×
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Tickets */}
                <div className="p-2 space-y-2 min-h-[200px]">
                  {ticketsByStatus(col).map(ticket => {
                    const days = daysInProgress(ticket);
                    return (
                      <div
                        key={ticket.id}
                        draggable={!isReadOnly}
                        onDragStart={() => { if (!isReadOnly) { dragTypeRef.current = 'ticket'; setDragging(ticket.id); } }}
                        onDragEnd={() => { setDragging(null); setDragOver(null); }}
                        className={`glass-card rounded-lg p-3 transition-all hover:border-white/20 ${isReadOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} ${dragging === ticket.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start gap-1.5 mb-2">
                          <TypeIcon type={ticket.type} />
                          <button onClick={() => setSelectedTicket(ticket)} className="text-sm text-white hover:text-blue-300 transition-colors line-clamp-2 flex-1 text-left leading-snug">
                            {ticket.title}
                          </button>
                        </div>
                        {(ticket.tags ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {(ticket.tags ?? []).slice(0, 3).map(tag => (
                              <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${tagColor(tag)}`}>{tag}</span>
                            ))}
                            {(ticket.tags ?? []).length > 3 && <span className="text-[10px] text-slate-500 self-center">+{(ticket.tags ?? []).length - 3}</span>}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <PriorityIcon priority={ticket.priority} />
                          {ticket.points != null && (
                            <span className="text-[10px] bg-slate-500/15 border border-slate-500/20 px-1.5 py-0.5 rounded text-slate-400 shrink-0">{ticket.points}</span>
                          )}
                          {days !== null && <TimeInProgressDot days={days} />}
                          <div className="ml-auto flex items-center gap-1.5 shrink-0">
                            <span className="font-mono text-[10px] text-slate-500">{ticket.ticketKey}</span>
                            {ticket.assignee ? (
                              ticket.assignee.avatarUrl ? (
                                <img src={ticket.assignee.avatarUrl} alt={ticket.assignee.firstName}
                                  className="w-6 h-6 rounded-full object-cover border border-white/20"
                                  title={`${ticket.assignee.firstName} ${ticket.assignee.lastName}`} />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs text-blue-300 font-bold"
                                  title={`${ticket.assignee.firstName} ${ticket.assignee.lastName}`}>
                                  {ticket.assignee.firstName[0]}
                                </div>
                              )
                            ) : <UnassignedAvatar />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Add Column */}
          {showAddCard && (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.005] min-h-[120px]">
              {addingColumn ? (
                <div className="p-4 space-y-2.5">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{t('newColumn')}</p>
                  <input ref={newColumnInputRef} value={newColumnName} onChange={e => setNewColumnName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addColumn(); if (e.key === 'Escape') { setAddingColumn(false); setNewColumnName(''); } }}
                    placeholder={t('columnPlaceholder')} className="input-dark w-full text-sm px-3 py-1.5 rounded-lg" maxLength={30} />
                  <div className="flex gap-2">
                    <button onClick={addColumn} disabled={!newColumnName.trim() || updateColumns.isPending} className="flex-1 text-xs py-1.5 btn-primary rounded-lg disabled:opacity-40">{t('add')}</button>
                    <button onClick={() => { setAddingColumn(false); setNewColumnName(''); }} className="flex-1 text-xs py-1.5 border border-white/10 rounded-lg text-slate-400 hover:bg-white/5 transition-colors">{t('cancel')}</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingColumn(true)} className="w-full h-full min-h-[120px] flex flex-col items-center justify-center gap-1.5 text-slate-600 hover:text-slate-400 hover:bg-white/[0.03] transition-colors rounded-xl">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                  <span className="text-xs">{t('addColumn')}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {selectedTicket && <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} lp={lp} t={t} />}
    </div>
  );
}
