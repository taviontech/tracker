'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../lib/hooks/useAuth';
import { teamApi, invitationsApi } from '../../../../lib/api';

function avatarClass(role: string) {
  if (role === 'OWNER') return 'bg-amber-500/20 border-amber-500/30 text-amber-300';
  if (role === 'CO_OWNER') return 'bg-violet-500/20 border-violet-500/30 text-violet-300';
  if (role === 'MANAGER') return 'bg-sky-500/20 border-sky-500/30 text-sky-300';
  return 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300';
}

function roleBadgeClass(role: string) {
  if (role === 'OWNER') return 'bg-amber-500/20 border-amber-500/30 text-amber-300';
  if (role === 'CO_OWNER') return 'bg-violet-500/20 border-violet-500/30 text-violet-300';
  if (role === 'MANAGER') return 'bg-sky-500/20 border-sky-500/30 text-sky-300';
  return 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300';
}

function roleLabelClass(role: string) {
  if (role === 'OWNER') return 'text-amber-400';
  if (role === 'CO_OWNER') return 'text-violet-400';
  if (role === 'MANAGER') return 'text-sky-400';
  return 'text-cyan-400';
}

export default function TeamPage() {
  const t = useTranslations('dashboard');
  const { data: auth } = useAuth();
  const companyId = auth?.memberships?.[0]?.companyId;
  const role = auth?.memberships?.[0]?.role;
  const qc = useQueryClient();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'CO_OWNER' | 'MANAGER' | 'DEVELOPER'>('DEVELOPER');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', companyId],
    queryFn: () => teamApi.getTeam(companyId!).then(r => r.data),
    enabled: !!companyId,
  });

  const deactivate = useMutation({
    mutationFn: (userId: string) => teamApi.deactivate(companyId!, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team', companyId] }),
  });

  const activate = useMutation({
    mutationFn: (userId: string) => teamApi.activate(companyId!, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team', companyId] }),
  });

  const { data: invitations } = useQuery({
    queryKey: ['invitations', companyId],
    queryFn: () => invitationsApi.listByCompany(companyId!).then(r => r.data),
    enabled: !!companyId && (role === 'OWNER' || role === 'CO_OWNER' || role === 'MANAGER'),
  });

  const cancelInvitation = useMutation({
    mutationFn: (id: string) => invitationsApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations', companyId] }),
  });

  const now = new Date();
  const pendingInvitations = (invitations ?? []).filter(
    (inv: any) => !inv.used && new Date(inv.expiresAt) > now
  );

  async function handleInvite() {
    if (!companyId || !inviteEmail) return;
    setInviteError(''); setInviteSuccess('');
    try {
      await invitationsApi.invite(companyId, inviteEmail, inviteRole);
      setInviteSuccess(`${t('inviteBtn')} → ${inviteEmail}`);
      setInviteEmail('');
      qc.invalidateQueries({ queryKey: ['invitations', companyId] });
    } catch (e: any) {
      setInviteError(e?.response?.data?.message || t('failedInvite'));
    }
  }

  const members = team ?? [];

  const filtered = members.filter((m: any) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      m.email?.toLowerCase().includes(q) ||
      m.firstName?.toLowerCase().includes(q) ||
      m.lastName?.toLowerCase().includes(q);
    const matchRole = filterRole === 'ALL' || m.role === filterRole;
    return matchSearch && matchRole;
  });

  const grouped = {
    OWNER: filtered.filter((m: any) => m.role === 'OWNER'),
    CO_OWNER: filtered.filter((m: any) => m.role === 'CO_OWNER'),
    MANAGER: filtered.filter((m: any) => m.role === 'MANAGER'),
    DEVELOPER: filtered.filter((m: any) => m.role === 'DEVELOPER'),
  };

  const roleLabels: Record<string, string> = {
    OWNER: t('owners'),
    CO_OWNER: t('deputyOwners'),
    MANAGER: t('managers'),
    DEVELOPER: t('developers'),
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">{t('team')}</h1>

      {/* Invite form */}
      {(role === 'OWNER' || role === 'CO_OWNER' || role === 'MANAGER') && (
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="text-sm font-semibold text-white mb-4">+ {t('inviteBtn')}</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="input-dark flex-1 min-w-[200px]"
              placeholder="colleague@company.com"
            />
            {role !== 'MANAGER' && (
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'CO_OWNER' | 'MANAGER' | 'DEVELOPER')}
                className="input-dark w-44"
              >
                <option value="CO_OWNER">{t('deputyOwner')}</option>
                <option value="MANAGER">{t('roleManager')}</option>
                <option value="DEVELOPER">{t('roleDeveloper')}</option>
              </select>
            )}
            <button onClick={handleInvite} className="px-5 py-2.5 btn-primary rounded-xl text-sm font-semibold">
              {t('sendInvite')}
            </button>
          </div>
          {inviteSuccess && <p className="mt-2 text-sm text-cyan-400">✓ {inviteSuccess}</p>}
          {inviteError && <p className="mt-2 text-sm text-red-400">⚠ {inviteError}</p>}
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('searchTeam')}
          className="input-dark flex-1 min-w-[200px]"
        />
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="input-dark w-36"
        >
          <option value="ALL">{t('allRoles')}</option>
          <option value="OWNER">{t('roleOwner')}</option>
          <option value="CO_OWNER">{t('deputyOwner')}</option>
          <option value="MANAGER">{t('roleManager')}</option>
          <option value="DEVELOPER">{t('roleDeveloper')}</option>
        </select>
      </div>

      {/* Member lists */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        ['OWNER', 'CO_OWNER', 'MANAGER', 'DEVELOPER'].map((r) => {
          const group = grouped[r as keyof typeof grouped];
          if (!group || group.length === 0) return null;
          return (
            <div key={r} className="mb-8">
              <h2 className={`text-xs uppercase tracking-widest font-semibold mb-3 ${roleLabelClass(r)}`}>{roleLabels[r]} ({group.length})</h2>
              <div className="space-y-2">
                {group.map((m: any) => (
                  <div key={m.userId} className="glass-card rounded-xl px-5 py-4 flex items-center gap-4">
                    {m.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.avatarUrl} alt={m.firstName} className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0" />
                    ) : (
                      <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm font-bold shrink-0 ${avatarClass(m.role)}`}>
                        {(m.firstName?.[0] ?? m.email[0]).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{m.firstName} {m.lastName}</p>
                      <p className="text-xs text-slate-500 truncate">{m.email}</p>
                      {m.devRoles && m.devRoles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.devRoles.map((dr: string) => (
                            <span key={dr} className="text-xs px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-slate-400">
                              {dr.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                      {m.invitedByEmail && (
                        <p className="text-xs text-slate-600 truncate mt-0.5">
                          {t('invitedBy')}: {m.invitedByFirstName} {m.invitedByLastName} <span className="text-slate-700">({m.invitedByEmail})</span>
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${roleBadgeClass(m.role)}`}>
                      {m.role === 'OWNER' ? t('roleOwner') : m.role === 'CO_OWNER' ? t('deputyOwner') : m.role === 'MANAGER' ? t('roleManager') : t('roleDeveloper')}
                    </span>
                    {!m.active && <span className="text-xs text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">{t('blocked')}</span>}
                    {(role === 'OWNER' && m.role !== 'OWNER') ||
                     (role === 'CO_OWNER' && m.role !== 'OWNER' && m.role !== 'CO_OWNER') ||
                     (role === 'MANAGER' && m.role === 'DEVELOPER') ? (
                      <button
                        onClick={() => m.active ? deactivate.mutate(m.userId) : activate.mutate(m.userId)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${m.active ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'}`}
                      >
                        {m.active ? t('deactivate') : t('activate')}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Pending invitations */}
      {(role === 'OWNER' || role === 'CO_OWNER' || role === 'MANAGER') && pendingInvitations.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xs text-amber-400 uppercase tracking-widest font-semibold mb-3">{t('pendingInvitations')} ({pendingInvitations.length})</h2>
          <div className="space-y-2">
            {pendingInvitations.map((inv: any) => (
              <div key={inv.id} className="glass-card rounded-xl px-5 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-sm text-amber-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{inv.email}</p>
                  <p className="text-xs text-slate-500">{t('expires')} {new Date(inv.expiresAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${roleBadgeClass(inv.role)}`}>
                  {inv.role === 'OWNER' ? t('roleOwner') : inv.role === 'CO_OWNER' ? t('deputyOwner') : inv.role === 'MANAGER' ? t('roleManager') : t('roleDeveloper')}
                </span>
                <button
                  onClick={() => cancelInvitation.mutate(inv.id)}
                  disabled={cancelInvitation.isPending}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
