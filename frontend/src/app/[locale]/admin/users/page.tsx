'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { adminApi } from '../../../../lib/api';

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: () => adminApi.getUsers(page, 20).then(r => r.data),
  });

  const block = useMutation({
    mutationFn: (id: string) => adminApi.blockUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const unblock = useMutation({
    mutationFn: (id: string) => adminApi.unblockUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const update = useMutation({
    mutationFn: () => adminApi.updateUser(editingUser.id, editForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); setEditingUser(null); },
  });

  const users = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const openEdit = (u: any) => {
    setEditingUser(u);
    setEditForm({ firstName: u.firstName ?? '', lastName: u.lastName ?? '', email: u.email ?? '' });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">{t('users')}</h1>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="glass-card rounded-2xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{t('userCol')}</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{t('roleCol')}</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{t('statusCol')}</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{t('joinedCol')}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300">
                          {(u.firstName?.[0] ?? u.email?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{u.firstName} {u.lastName}</p>
                          <p className="text-slate-500 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border ${
                        u.systemRole === 'ADMIN'
                          ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                          : 'border-slate-500/30 text-slate-400 bg-slate-500/10'
                      }`}>{u.systemRole}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border ${
                        u.active
                          ? 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10'
                          : 'border-red-500/30 text-red-400 bg-red-500/10'
                      }`}>{u.active ? t('activeStatus') : t('blockedStatus')}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(u)} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-500/10 transition-all">{t('editBtn')}</button>
                        {u.active ? (
                          <button onClick={() => block.mutate(u.id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-all">{t('blockBtn')}</button>
                        ) : (
                          <button onClick={() => unblock.mutate(u.id)} className="text-xs text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded hover:bg-cyan-500/10 transition-all">{t('unblockBtn')}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-40 transition-all">{t('prevBtn')}</button>
              <span className="text-xs text-slate-500">{t('page')} {page + 1} {t('of')} {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-40 transition-all">{t('nextBtn')}</button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-base font-semibold text-white mb-5">{t('editUser')}</h2>
            <div className="space-y-3">
              <input value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} className="input-dark" placeholder="First name" />
              <input value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} className="input-dark" placeholder="Last name" />
              <input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="input-dark" placeholder="Email" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => update.mutate()} disabled={update.isPending} className="flex-1 px-4 py-2.5 btn-primary rounded-xl text-sm font-semibold">
                {update.isPending ? t('saving') : t('save')}
              </button>
              <button onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all">✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
