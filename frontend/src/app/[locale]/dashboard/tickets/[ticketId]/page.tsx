'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../../lib/hooks/useAuth';
import { ticketsApi, sprintsApi, teamApi, filesApi, companiesApi, Ticket, TicketHistoryEntry } from '../../../../../lib/api';

// ── helpers ───────────────────────────────────────────────────────────────────

function typeIcon(t: string) {
  if (t === 'BUG') return (
    <span className="w-5 h-5 rounded-sm bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0" title="Bug">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" className="text-red-400"><circle cx="6" cy="6" r="5"/><path d="M4 4l4 4M8 4l-4 4" stroke="#fff" strokeWidth="1.5" fill="none"/></svg>
    </span>
  );
  if (t === 'STORY') return (
    <span className="w-5 h-5 rounded-sm bg-green-500/20 border border-green-500/40 flex items-center justify-center shrink-0" title="Story">
      <svg width="10" height="11" viewBox="0 0 10 11" fill="none" className="text-green-400"><path d="M2 1h6a1 1 0 011 1v8L5 8 2 10V2a1 1 0 010-1z" fill="currentColor"/></svg>
    </span>
  );
  if (t === 'EPIC') return (
    <span className="w-5 h-5 rounded-sm bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0" title="Epic">
      <svg width="9" height="12" viewBox="0 0 7 11" fill="currentColor" className="text-purple-400"><path d="M4 0L0 6h3L2 11l5-7H4L5 0z"/></svg>
    </span>
  );
  if (t === 'SUBTASK') return (
    <span className="w-5 h-5 rounded-sm bg-sky-500/15 border border-sky-500/35 flex items-center justify-center shrink-0" title="Subtask">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sky-400"><rect x="1" y="1" width="8" height="8" rx="1.5"/><path d="M3.5 5h3M5 3.5v3"/></svg>
    </span>
  );
  return (
    <span className="w-5 h-5 rounded-sm bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0" title="Task">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400"><polyline points="2,5 4.5,7.5 8.5,2.5"/></svg>
    </span>
  );
}

function priorityIcon(p: string) {
  const arrow = (
    <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor">
      <path d="M4 0L7.46 5H.54L4 0Z"/>
    </svg>
  );
  if (p === 'LOW') return <span title="Low" className="flex items-center gap-px text-blue-400">{arrow}</span>;
  if (p === 'MEDIUM') return <span title="Medium" className="flex items-center gap-px text-yellow-400">{arrow}{arrow}</span>;
  if (p === 'HIGH') return <span title="High" className="flex items-center gap-px text-red-400">{arrow}{arrow}{arrow}</span>;
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

function tagColor(tag: string) {
  const palette = [
    'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'bg-green-500/20 text-green-300 border-green-500/30',
    'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'bg-red-500/20 text-red-300 border-red-500/30',
    'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    'bg-pink-500/20 text-pink-300 border-pink-500/30',
  ];
  const hash = tag.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function Avatar({ name, avatarUrl, size = 6 }: { name: string; avatarUrl?: string; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full`;
  if (avatarUrl) return <img src={avatarUrl} alt={name} className={`${cls} object-cover border border-white/20`} />;
  return (
    <div className={`${cls} bg-blue-500/30 border border-blue-500/40 flex items-center justify-center text-[10px] font-bold text-blue-300 shrink-0`}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

type TFunc = (key: string, values?: Record<string, string | number>) => string;

function timeAgo(dateStr: string, t: TFunc) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return t('timeJustNow');
  if (diff < 3600) return t('timeMAgo', { n: Math.floor(diff / 60) });
  if (diff < 86400) return t('timeHAgo', { n: Math.floor(diff / 3600) });
  if (diff < 86400 * 7) return t('timeDAgo', { n: Math.floor(diff / 86400) });
  return new Date(dateStr).toLocaleDateString();
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
const SAFE_COLORS: Record<string, string> = {
  red: '#f87171', orange: '#fb923c', yellow: '#fbbf24', green: '#4ade80',
  blue: '#60a5fa', purple: '#c084fc', pink: '#f472b6', gray: '#94a3b8',
};

function renderMd(raw: string) {
  const esc = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc
    .replace(/^### (.+)$/gm, '<span class="block font-semibold mt-2 mb-1 text-sm" style="color:#e2e8f0">$1</span>')
    .replace(/^## (.+)$/gm,  '<span class="block font-semibold mt-2 mb-1 text-base" style="color:#f1f5f9">$1</span>')
    .replace(/^# (.+)$/gm,   '<span class="block font-bold mt-3 mb-1 text-lg" style="color:#f8fafc">$1</span>')
    .replace(/^> (.+)$/gm,   '<span class="block ml-4 pl-3 border-l-2 border-slate-600 text-slate-400 italic">$1</span>')
    .replace(/^(\d+)\. (.+)$/gm, '<span class="block ml-4"><span class="text-slate-500 mr-2">$1.</span>$2</span>')
    .replace(/^- (.+)$/gm,   '<span class="block ml-4 before:content-[\'•\'] before:mr-2 before:text-slate-500">$1</span>')
    .replace(/\[([a-z]+)\]([^\[]*)\[\/\1\]/g, (_, color, text) => {
      const hex = SAFE_COLORS[color];
      return hex ? `<span style="color:${hex}">${text}</span>` : text;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/__([^_]+)__/g, '<u>$1</u>')
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 rounded font-mono text-blue-300 text-[0.85em]">$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer noopener" class="text-blue-400 underline">$1</a>')
    .replace(/\n/g, '<br>');
}

// ── Formatting toolbar ─────────────────────────────────────────────────────────
function FormatBar({ textareaRef, onChange }: {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onChange: (v: string) => void;
}) {
  const t = useTranslations('ticketDetailPage');
  const [showColors, setShowColors] = useState(false);

  function wrap(before: string, after = before) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = el.value.slice(start, end) || 'text';
    const newVal = el.value.slice(0, start) + before + sel + after + el.value.slice(end);
    onChange(newVal);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + before.length, start + before.length + sel.length); }, 0);
  }

  function prefix(p: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = el.value.lastIndexOf('\n', start - 1) + 1;
    const newVal = el.value.slice(0, lineStart) + p + el.value.slice(lineStart);
    onChange(newVal);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + p.length, start + p.length); }, 0);
  }

  function insertLink() {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = el.value.slice(start, end) || 'link text';
    const newVal = el.value.slice(0, start) + `[${sel}](https://)` + el.value.slice(end);
    onChange(newVal);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + sel.length + 3, start + sel.length + 3 + 8); }, 0);
  }

  function insertColor(color: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = el.value.slice(start, end) || 'text';
    const newVal = el.value.slice(0, start) + `[${color}]${sel}[/${color}]` + el.value.slice(end);
    onChange(newVal);
    setShowColors(false);
    setTimeout(() => { el.focus(); }, 0);
  }

  const btn = 'px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors';

  return (
    <div className="border-b border-white/[0.07] bg-white/[0.02]">
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5">
        {/* Text style */}
        <button type="button" className={`${btn} font-bold`} onClick={() => wrap('**')} title="Bold">B</button>
        <button type="button" className={`${btn} italic`} onClick={() => wrap('*')} title="Italic">I</button>
        <button type="button" className={`${btn} line-through`} onClick={() => wrap('~~')} title="Strikethrough">S</button>
        <button type="button" className={`${btn} underline`} onClick={() => wrap('__')} title="Underline">U</button>
        <button type="button" className={`${btn} font-mono`} onClick={() => wrap('`')} title="Inline code">{'<>'}</button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Headings */}
        <button type="button" className={`${btn} font-bold text-base`} onClick={() => prefix('# ')} title="Heading 1">H1</button>
        <button type="button" className={`${btn} font-bold`} onClick={() => prefix('## ')} title="Heading 2">H2</button>
        <button type="button" className={`${btn} font-semibold text-[11px]`} onClick={() => prefix('### ')} title="Heading 3">H3</button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Lists */}
        <button type="button" className={btn} onClick={() => prefix('- ')} title="Bullet list">{t('formatBulletList')}</button>
        <button type="button" className={btn} onClick={() => prefix('1. ')} title="Numbered list">{t('formatNumList')}</button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Block */}
        <button type="button" className={btn} onClick={() => prefix('> ')} title="Quote">{t('formatQuote')}</button>
        <button type="button" className={btn} onClick={insertLink} title="Link">🔗</button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Color picker */}
        <div className="relative">
          <button
            type="button"
            className={`${btn} flex items-center gap-1`}
            onClick={() => setShowColors(v => !v)}
            title="Text color"
          >
            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 via-blue-400 to-green-400" />
            {t('formatColor')}
          </button>
          {showColors && (
            <div className="absolute top-full left-0 mt-1 flex gap-1 p-2 rounded-lg bg-slate-800 border border-white/10 shadow-xl z-10">
              {Object.entries(SAFE_COLORS).map(([name, hex]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => insertColor(name)}
                  title={name}
                  className="w-5 h-5 rounded-full border border-white/20 hover:scale-125 transition-transform"
                  style={{ background: hex }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── History entry renderer ─────────────────────────────────────────────────────
function HistoryEntry({ entry }: { entry: TicketHistoryEntry }) {
  const t = useTranslations('ticketDetailPage');

  const FIELD_LABELS: Record<string, string> = {
    title: t('fieldTitle'),
    description: t('fieldDescription'),
    status: t('fieldStatus'),
    priority: t('fieldPriority'),
    type: t('fieldType'),
    points: t('fieldPoints'),
    assignee: t('fieldAssignee'),
    sprint: t('fieldSprint'),
  };

  const name = entry.user
    ? `${entry.user.firstName} ${entry.user.lastName}`
    : t('someone');
  const initials = entry.user
    ? `${entry.user.firstName[0]}${entry.user.lastName[0]}`.toUpperCase()
    : '?';

  const fieldLabel = entry.field ? (FIELD_LABELS[entry.field] ?? entry.field) : null;

  let text: React.ReactNode;
  if (entry.action === 'CREATED') {
    text = <><span className="text-white font-medium">{name}</span> {t('historyCreated')}</>;
  } else if (entry.field === 'description') {
    text = <><span className="text-white font-medium">{name}</span> {t('historyUpdatedDesc')}</>;
  } else if (fieldLabel) {
    text = (
      <>
        <span className="text-white font-medium">{name}</span> {t('historyChanged')}{' '}
        <span className="text-slate-300">{fieldLabel}</span> {t('historyFrom')}{' '}
        <span className="line-through text-slate-500">{entry.oldValue}</span>{' '}
        → <span className="text-slate-200">{entry.newValue}</span>
      </>
    );
  } else {
    text = <><span className="text-white font-medium">{name}</span> {t('historyMadeChange')}</>;
  }

  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[10px] text-slate-400 font-bold shrink-0 mt-0.5">
        {entry.user?.avatarUrl
          ? <img src={entry.user.avatarUrl} alt={name} className="w-6 h-6 rounded-full object-cover" />
          : initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-400 leading-relaxed">{text}</p>
        <span className="text-xs text-slate-600">{timeAgo(entry.createdAt, t as unknown as TFunc)}</span>
      </div>
    </div>
  );
}

// ── Sidebar field ──────────────────────────────────────────────────────────────
function SidebarField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold">{label}</span>
      <div className="text-sm text-slate-300">{children}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;
  const locale = useLocale();
  const t = useTranslations('ticketDetailPage');
  const lp = (p: string) => locale === 'en' ? p : `/${locale}${p}`;
  const router = useRouter();
  const qc = useQueryClient();
  const { data: auth } = useAuth();
  const companyId = auth?.memberships?.[0]?.companyId ?? '';

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [type, setType] = useState('TASK');
  const [points, setPoints] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [comment, setComment] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [commentUploading, setCommentUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activityTab, setActivityTab] = useState<'comments' | 'history'>('comments');
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentFileRef = useRef<HTMLInputElement>(null);

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketsApi.get(ticketId).then(r => r.data),
    enabled: !!ticketId,
  });

  useEffect(() => {
    if (!ticket) return;
    setTitle(ticket.title);
    setDescription(ticket.description ?? '');
    setPriority(ticket.priority);
    setType(ticket.type);
    setPoints(ticket.points?.toString() ?? '');
    setAssigneeId(ticket.assignee?.id ?? '');
    setSprintId(ticket.sprint?.id ?? '');
  }, [ticket?.id]);

  const { data: team } = useQuery({
    queryKey: ['team', companyId],
    queryFn: () => teamApi.getTeam(companyId).then(r => r.data),
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

  const { data: history } = useQuery<TicketHistoryEntry[]>({
    queryKey: ['ticket-history', ticketId],
    queryFn: () => ticketsApi.getHistory(ticketId).then(r => r.data),
    enabled: !!ticketId && activityTab === 'history',
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['ticket', ticketId] });
    qc.invalidateQueries({ queryKey: ['tickets'] });
    qc.invalidateQueries({ queryKey: ['ticket-history', ticketId] });
  }, [qc, ticketId]);

  const saveField = useCallback(async (patch: Record<string, unknown>) => {
    if (!ticket) return;
    setSaving(true);
    try {
      await ticketsApi.update(ticketId, {
        title: ('title' in patch ? patch.title : ticket.title) as string,
        description: ('description' in patch ? patch.description : ticket.description) as string,
        type: ('type' in patch ? patch.type : ticket.type) as string,
        priority: ('priority' in patch ? patch.priority : ticket.priority) as string,
        status: ticket.status,
        points: ('points' in patch ? patch.points : ticket.points) as number | undefined,
        assigneeId: ('assigneeId' in patch ? patch.assigneeId : ticket.assignee?.id) as string | null | undefined,
        sprintId: ('sprintId' in patch ? patch.sprintId : ticket.sprint?.id) as string | null | undefined,
        tags: ('tags' in patch ? patch.tags : ticket.tags) as string[],
      });
      invalidate();
    } finally {
      setSaving(false);
    }
  }, [ticket, ticketId, invalidate]);

  // @mention helpers
  function handleCommentInput(value: string) {
    setComment(value);
    const el = commentRef.current;
    if (!el) return;
    const cursor = el.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const m = before.match(/@(\w*)$/);
    if (m) {
      setMentionSearch(m[1]);
      setMentionStart(cursor - m[0].length);
      setMentionOpen(true);
    } else {
      setMentionOpen(false);
      setMentionStart(-1);
    }
  }

  function insertMention(member: any) {
    const el = commentRef.current;
    if (!el || mentionStart === -1) return;
    const mention = `@${member.firstName} ${member.lastName}`;
    const before = comment.slice(0, mentionStart);
    const cursor = el.selectionStart ?? comment.length;
    const after = comment.slice(cursor);
    const newVal = before + mention + ' ' + after;
    setComment(newVal);
    setMentionOpen(false);
    setMentionStart(-1);
    setTimeout(() => {
      el.focus();
      const pos = before.length + mention.length + 1;
      el.setSelectionRange(pos, pos);
    }, 0);
  }

  function addTag(raw: string) {
    if (!ticket) return;
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag || (ticket.tags ?? []).includes(tag)) return;
    saveField({ tags: [...(ticket.tags ?? []), tag] });
    setTagInput('');
  }

  function removeTag(tag: string) {
    if (!ticket) return;
    saveField({ tags: (ticket.tags ?? []).filter(tg => tg !== tag) });
  }

  const updateStatus = useMutation({
    mutationFn: (s: string) => ticketsApi.updateStatus(ticketId, s),
    onSuccess: invalidate,
  });

  const addComment = useMutation({
    mutationFn: () => ticketsApi.addComment(ticketId, comment),
    onSuccess: () => { invalidate(); setComment(''); },
  });

  const deleteComment = useMutation({
    mutationFn: (id: string) => ticketsApi.deleteComment(id),
    onSuccess: invalidate,
  });

  const deleteAttachment = useMutation({
    mutationFn: (id: string) => ticketsApi.deleteAttachment(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: () => ticketsApi.delete(ticketId),
    onSuccess: () => router.push(lp('/dashboard/tickets')),
  });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await filesApi.upload(file);
      await ticketsApi.addAttachment(ticketId, {
        fileName: uploaded.fileName,
        fileUrl: uploaded.url,
        fileSize: file.size,
        mimeType: file.type,
      });
      invalidate();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleCommentFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCommentUploading(true);
    try {
      const uploaded = await filesApi.upload(file);
      const isImage = file.type.startsWith('image/');
      const link = isImage
        ? `![${uploaded.fileName}](${uploaded.url})`
        : `[${uploaded.fileName}](${uploaded.url})`;
      setComment(prev => prev ? `${prev}\n${link}` : link);
      setTimeout(() => commentRef.current?.focus(), 0);
    } finally {
      setCommentUploading(false);
      if (commentFileRef.current) commentFileRef.current.value = '';
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ticket) return <div className="p-8 text-slate-500">{t('notFound')}</div>;

  const STATUSES: string[] = companyStatuses ?? ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
  const teamMembers = (team as any[]) ?? [];
  const sprintList = (sprints as any[]) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5 text-sm text-slate-500">
        <Link href={lp('/dashboard/tickets')} className="hover:text-slate-300 transition-colors">{t('breadcrumb')}</Link>
        <span>/</span>
        <span className="text-slate-400">{ticket.ticketKey}</span>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Main content ───────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Title + key */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {typeIcon(ticket.type)}
              <span className="text-xs font-semibold text-slate-500 font-mono tracking-wide">{ticket.ticketKey}</span>
              {saving && <span className="text-xs text-slate-600 ml-2">{t('saving')}</span>}
            </div>

            {editingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={() => { setEditingTitle(false); if (title !== ticket.title) saveField({ title }); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur(); } if (e.key === 'Escape') { setTitle(ticket.title); setEditingTitle(false); } }}
                className="input-dark w-full text-xl font-bold"
              />
            ) : (
              <h1
                className="text-xl font-bold text-white cursor-pointer hover:bg-white/[0.04] rounded px-1 -mx-1 py-0.5 transition-colors"
                onClick={() => setEditingTitle(true)}
                title="Click to edit"
              >
                {ticket.title}
              </h1>
            )}
          </div>

          {/* Description */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('descriptionLabel')}</span>
              {!editingDesc && (
                <button
                  onClick={() => { setEditingDesc(true); setTimeout(() => descRef.current?.focus(), 50); }}
                  className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded hover:bg-white/[0.06] transition-colors"
                >
                  {t('editBtn')}
                </button>
              )}
            </div>

            {editingDesc ? (
              <div>
                <FormatBar textareaRef={descRef} onChange={setDescription} />
                <textarea
                  ref={descRef}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={10}
                  placeholder={t('descPlaceholder')}
                  className="w-full bg-transparent px-4 py-3 text-sm text-slate-300 resize-none outline-none placeholder:text-slate-600"
                />
                <div className="flex gap-2 px-4 pb-3">
                  <button
                    onClick={() => { setEditingDesc(false); if (description !== (ticket.description ?? '')) saveField({ description }); }}
                    className="px-3 py-1.5 btn-primary rounded-lg text-xs font-semibold"
                  >
                    {t('saveBtn')}
                  </button>
                  <button
                    onClick={() => { setDescription(ticket.description ?? ''); setEditingDesc(false); }}
                    className="px-3 py-1.5 text-xs text-slate-400 border border-white/10 rounded-lg hover:bg-white/5"
                  >
                    {t('cancelBtn')}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="px-4 py-3 min-h-[80px] text-sm text-slate-400 leading-relaxed cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => { setEditingDesc(true); setTimeout(() => descRef.current?.focus(), 50); }}
              >
                {ticket.description ? (
                  <div className="prose-sm" dangerouslySetInnerHTML={{ __html: renderMd(ticket.description) }} />
                ) : (
                  <span className="text-slate-600 italic">{t('descEmpty')}</span>
                )}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('attachmentsLabel')} {ticket.attachments.length > 0 && `(${ticket.attachments.length})`}
              </span>
              <label className={`text-xs px-3 py-1.5 border border-white/10 rounded-lg text-slate-300 hover:bg-white/5 cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                    {t('uploading')}
                  </span>
                ) : t('attachFile')}
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
            <div className="px-4 py-3">
              {ticket.attachments.length === 0 ? (
                <p className="text-sm text-slate-600 py-2">{t('noAttachments')}</p>
              ) : (
                <div className="space-y-2">
                  {ticket.attachments.map(att => {
                    const isImage = att.mimeType?.startsWith('image/');
                    return (
                      <div key={att.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] group">
                        <span className="text-lg shrink-0">{isImage ? '🖼' : '📎'}</span>
                        <div className="flex-1 min-w-0">
                          <a href={att.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:text-blue-300 truncate block">{att.fileName}</a>
                          {att.fileSize && <span className="text-xs text-slate-600">{(att.fileSize / 1024).toFixed(1)} KB</span>}
                        </div>
                        <button
                          onClick={() => deleteAttachment.mutate(att.id)}
                          className="opacity-0 group-hover:opacity-100 text-xs text-slate-600 hover:text-red-400 transition-all px-2 py-1 rounded hover:bg-red-500/10"
                        >
                          {t('removeAttachment')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Activity / History tabs */}
          <div className="glass-card rounded-xl overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-white/[0.06]">
              <button
                onClick={() => setActivityTab('comments')}
                className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activityTab === 'comments'
                    ? 'text-white border-b-2 border-blue-400 -mb-px'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t('commentsTab')} {ticket.comments.length > 0 && `(${ticket.comments.length})`}
              </button>
              <button
                onClick={() => setActivityTab('history')}
                className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activityTab === 'history'
                    ? 'text-white border-b-2 border-blue-400 -mb-px'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t('historyTab')}
              </button>
            </div>

            {activityTab === 'comments' ? (
              <div className="px-4 py-4 space-y-4">
                {ticket.comments.map(c => (
                  <div key={c.id} className="flex gap-3 group">
                    <Avatar name={`${c.author.firstName}${c.author.lastName}`} avatarUrl={c.author.avatarUrl} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-300">{c.author.firstName} {c.author.lastName}</span>
                        <span className="text-xs text-slate-600">{timeAgo(c.createdAt, t as unknown as TFunc)}</span>
                        {c.author.email === auth?.user?.email && (
                          <button
                            onClick={() => deleteComment.mutate(c.id)}
                            className="opacity-0 group-hover:opacity-100 text-xs text-slate-600 hover:text-red-400 transition-all ml-auto"
                          >
                            {t('deleteComment')}
                          </button>
                        )}
                      </div>
                      <div
                        className="text-sm text-slate-400 leading-relaxed bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.04]"
                        dangerouslySetInnerHTML={{ __html: renderMd(c.body) }}
                      />
                    </div>
                  </div>
                ))}

                {/* Add comment */}
                <div className="flex gap-3 pt-2">
                  <Avatar name={`${auth?.user?.firstName ?? ''}${auth?.user?.lastName ?? ''}`} avatarUrl={auth?.user?.avatarUrl} />
                  <div className="flex-1 space-y-2 relative">
                    <textarea
                      ref={commentRef}
                      value={comment}
                      onChange={e => handleCommentInput(e.target.value)}
                      placeholder={t('commentPlaceholder')}
                      rows={3}
                      className="input-dark w-full resize-none text-sm"
                      onKeyDown={e => {
                        if (e.key === 'Escape') { setMentionOpen(false); return; }
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && comment.trim()) addComment.mutate();
                      }}
                    />
                    {/* @mention dropdown */}
                    {mentionOpen && (() => {
                      const filteredMembers = teamMembers
                        .filter((m: any) => m.active)
                        .filter((m: any) =>
                          mentionSearch === '' ||
                          m.firstName.toLowerCase().startsWith(mentionSearch.toLowerCase()) ||
                          m.lastName.toLowerCase().startsWith(mentionSearch.toLowerCase())
                        );
                      if (filteredMembers.length === 0) return null;
                      return (
                        <div className="absolute bottom-full left-0 mb-1 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-20 min-w-[200px] py-1 max-h-48 overflow-y-auto">
                          {filteredMembers.map((m: any) => (
                            <button
                              key={m.userId}
                              type="button"
                              onMouseDown={e => { e.preventDefault(); insertMention(m); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.05] text-left"
                            >
                              <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center text-[9px] font-bold text-blue-300 shrink-0">
                                {m.firstName[0]}
                              </div>
                              {m.firstName} {m.lastName}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addComment.mutate()}
                        disabled={!comment.trim() || addComment.isPending}
                        className="px-4 py-1.5 btn-primary rounded-lg text-xs font-semibold disabled:opacity-50"
                      >
                        {addComment.isPending ? t('sending') : t('saveComment')}
                      </button>
                      <label className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/10 rounded-lg text-slate-400 hover:bg-white/5 cursor-pointer transition-colors ${commentUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {commentUploading ? (
                          <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                          </svg>
                        )}
                        {t('attach')}
                        <input ref={commentFileRef} type="file" className="hidden" onChange={handleCommentFileUpload} disabled={commentUploading} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-4 py-4 space-y-4">
                {!history ? (
                  <div className="flex justify-center py-6">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-slate-600 py-2 text-center">{t('noHistory')}</p>
                ) : (
                  history.map(entry => <HistoryEntry key={entry.id} entry={entry} />)
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ──────────────────────────────────────────────── */}
        <div className="w-64 shrink-0 space-y-4">

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="flex-1 text-xs px-3 py-2 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {deleteMutation.isPending ? t('deleting') : t('deleteBtn')}
            </button>
          </div>

          {/* Status */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <span className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold block">{t('statusLabel')}</span>
            <div className="space-y-1.5">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus.mutate(s)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                    ticket.status === s
                      ? s === 'DONE' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                      : s === 'IN_PROGRESS' ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                      : s === 'IN_REVIEW' ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                      : 'bg-slate-500/20 border-slate-500/30 text-slate-300'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] border-transparent'
                  }`}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <span className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold block">{t('tagsLabel')}</span>
            <div className="flex flex-wrap gap-1.5">
              {(ticket.tags ?? []).map(tag => (
                <span
                  key={tag}
                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${tagColor(tag)}`}
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-white ml-0.5 leading-none text-[10px]">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                placeholder={t('tagPlaceholder')}
                className="input-dark flex-1 text-xs py-1"
              />
              <button
                onClick={() => addTag(tagInput)}
                disabled={!tagInput.trim()}
                className="px-2 py-1 text-xs btn-primary rounded-lg disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="glass-card rounded-xl p-4 space-y-4">
            <span className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold block">{t('detailsLabel')}</span>

            {/* Assignee */}
            <SidebarField label={t('assigneeLabel')}>
              <select
                value={assigneeId}
                onChange={e => {
                  setAssigneeId(e.target.value);
                  saveField({ assigneeId: e.target.value || null });
                }}
                className="input-dark text-sm py-1.5 pl-2 pr-8 w-full"
              >
                <option value="">{t('unassigned')}</option>
                {teamMembers.filter((m: any) => m.active).map((m: any) => (
                  <option key={m.userId} value={m.userId}>{m.firstName} {m.lastName}</option>
                ))}
              </select>
            </SidebarField>

            {/* Reporter */}
            <SidebarField label={t('reporterLabel')}>
              {ticket.reporter ? (
                <div className="flex items-center gap-2">
                  <Avatar name={`${ticket.reporter.firstName}${ticket.reporter.lastName}`} avatarUrl={ticket.reporter.avatarUrl} />
                  <span>{ticket.reporter.firstName} {ticket.reporter.lastName}</span>
                </div>
              ) : <span className="text-slate-600">—</span>}
            </SidebarField>

            {/* Priority */}
            <SidebarField label={t('priorityLabel')}>
              <div className="flex items-center gap-2">
                {priorityIcon(priority)}
                <select
                  value={priority}
                  onChange={e => { setPriority(e.target.value); saveField({ priority: e.target.value }); }}
                  className="input-dark text-sm py-1.5 pl-2 pr-8 flex-1"
                >
                  <option value="LOW">{t('priorityLow')}</option>
                  <option value="MEDIUM">{t('priorityMedium')}</option>
                  <option value="HIGH">{t('priorityHigh')}</option>
                  <option value="CRITICAL">{t('priorityCritical')}</option>
                </select>
              </div>
            </SidebarField>

            {/* Type */}
            <SidebarField label={t('typeLabel')}>
              <div className="flex items-center gap-2">
                {typeIcon(type)}
                <select
                  value={type}
                  onChange={e => { setType(e.target.value); saveField({ type: e.target.value }); }}
                  className="input-dark text-sm py-1.5 pl-2 pr-8 flex-1"
                >
                  <option value="TASK">{t('typeTask')}</option>
                  <option value="BUG">{t('typeBug')}</option>
                  <option value="STORY">{t('typeStory')}</option>
                  <option value="EPIC">{t('typeEpic')}</option>
                  <option value="SUBTASK">{t('typeSubtask')}</option>
                </select>
              </div>
            </SidebarField>

            {/* Sprint */}
            <SidebarField label={t('sprintLabel')}>
              <select
                value={sprintId}
                onChange={e => {
                  setSprintId(e.target.value);
                  saveField({ sprintId: e.target.value || null });
                }}
                className="input-dark text-sm py-1.5 pl-2 pr-8 w-full"
              >
                <option value="">{t('backlog')}</option>
                {sprintList.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </SidebarField>

            {/* Story Points */}
            <SidebarField label={t('storyPointsLabel')}>
              <input
                type="number"
                value={points}
                min="0"
                placeholder="—"
                onChange={e => setPoints(e.target.value)}
                onBlur={() => {
                  const p = points ? parseInt(points) : undefined;
                  if (p !== ticket.points) saveField({ points: p });
                }}
                className="w-full bg-transparent text-sm text-slate-300 border border-white/10 rounded-lg px-2 py-1.5 hover:border-white/20 transition-colors outline-none"
              />
            </SidebarField>

            {/* Dates */}
            <div className="border-t border-white/[0.06] pt-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">{t('createdLabel')}</span>
                <span className="text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">{t('updatedLabel')}</span>
                <span className="text-slate-400">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
