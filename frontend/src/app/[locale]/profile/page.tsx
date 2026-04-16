'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { profileApi } from '../../../lib/api';
import { useAuth } from '../../../lib/hooks/useAuth';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const qc = useQueryClient();
  const { data: auth } = useAuth();
  const [editField, setEditField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ firstName: '', lastName: '', phone: '' });
  const [companyName, setCompanyName] = useState('');
  const [editingCompany, setEditingCompany] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const ownerMembership = auth?.memberships?.find(m => m.role === 'OWNER');

  const updateCompany = useMutation({
    mutationFn: (name: string) => profileApi.updateCompany(ownerMembership!.companyId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      setEditingCompany(false);
      setSaveSuccess(t('saved'));
      setTimeout(() => setSaveSuccess(''), 2000);
    },
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.get().then(r => r.data),
  });

  const updateProfile = useMutation({
    mutationFn: (data: any) => profileApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      setEditField(null);
      setSaveSuccess(t('saved'));
      setTimeout(() => setSaveSuccess(''), 2000);
    },
  });

  const changePassword = useMutation({
    mutationFn: () => profileApi.changePassword(pwForm.current, pwForm.next),
    onSuccess: () => {
      setPwForm({ current: '', next: '', confirm: '' });
      setPwError('');
      setPwSuccess(t('passwordChanged'));
      setTimeout(() => setPwSuccess(''), 3000);
    },
    onError: (e: any) => setPwError(e?.response?.data?.message || 'Failed to change password'),
  });

  const handlePasswordSubmit = () => {
    if (pwForm.next !== pwForm.confirm) { setPwError(t('passwordsNotMatch')); return; }
    if (pwForm.next.length < 8) { setPwError(t('passwordTooShort')); return; }
    setPwError('');
    changePassword.mutate();
  };

  const startEdit = (field: string) => {
    setEditValues({
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      phone: profile?.phone ?? '',
    });
    setEditField(field);
  };

  const saveEdit = () => {
    updateProfile.mutate({
      firstName: editValues.firstName,
      lastName: editValues.lastName,
      phone: editValues.phone || undefined,
    });
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile.mutate({ avatarUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) return (
    <div className="flex justify-center py-24">
      <div className="relative">
        <div className="w-10 h-10 border-2 border-blue-500/30 rounded-full" />
        <div className="absolute inset-0 w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  const p = profile ?? {} as any;
  const initials = ((p.firstName?.[0] ?? '') + (p.lastName?.[0] ?? '')).toUpperCase() || p.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
        </div>
      </div>

      {/* Avatar section */}
      <div className="gradient-border-card rounded-2xl p-6 mb-6 animate-fade-in-up animate-delay-100">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            {p.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatarUrl} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/30" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/30 border-2 border-blue-500/40 flex items-center justify-center text-xl font-bold text-blue-300 animate-glow">
                {initials}
              </div>
            )}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={updateProfile.isPending}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 hover:bg-blue-400 rounded-full flex items-center justify-center shadow-lg transition-colors"
              title={t('changeAvatarTitle')}
            >
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFile}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-white">{p.firstName} {p.lastName}</p>
            <p className="text-sm text-slate-400">{p.email}</p>
            {p.phone && <p className="text-xs text-slate-600 mt-0.5">{p.phone}</p>}
            {updateProfile.isPending && <p className="text-xs text-blue-400 mt-1">{t('saving')}</p>}
          </div>
        </div>
      </div>

      {/* Info fields */}
      <div className="glass-card rounded-2xl divide-y divide-white/[0.06] mb-6 animate-fade-in-up animate-delay-200">
        {[
          { key: 'name', label: t('fullName'), value: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || '—', editable: true },
          { key: 'email', label: t('email'), value: p.email ?? '—', editable: false },
          { key: 'phone', label: t('phone'), value: p.phone ?? '—', editable: true },
        ].map(row => (
          <div key={row.key} className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 mb-0.5">{row.label}</p>
              {editField === row.key ? (
                <div className="flex gap-2 mt-1">
                  {row.key === 'name' ? (
                    <>
                      <input
                        value={editValues.firstName}
                        onChange={e => setEditValues(v => ({ ...v, firstName: e.target.value }))}
                        className="input-dark flex-1 text-sm"
                        placeholder={t('firstNamePlaceholder')}
                        autoFocus
                      />
                      <input
                        value={editValues.lastName}
                        onChange={e => setEditValues(v => ({ ...v, lastName: e.target.value }))}
                        className="input-dark flex-1 text-sm"
                        placeholder={t('lastNamePlaceholder')}
                      />
                    </>
                  ) : (
                    <input
                      value={editValues.phone}
                      onChange={e => setEditValues(v => ({ ...v, phone: e.target.value }))}
                      className="input-dark flex-1 text-sm"
                      placeholder={t('phonePlaceholder')}
                      autoFocus
                    />
                  )}
                  <button onClick={saveEdit} disabled={updateProfile.isPending} className="px-3 py-1.5 btn-primary rounded-lg text-xs font-semibold shrink-0">{t('saveBtn')}</button>
                  <button onClick={() => setEditField(null)} className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-slate-400 hover:text-white transition-all shrink-0">✕</button>
                </div>
              ) : (
                <p className="text-sm text-white">{row.value}</p>
              )}
            </div>
            {row.editable && editField !== row.key && (
              <button
                onClick={() => startEdit(row.key)}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors shrink-0"
              >
                {t('edit')}
              </button>
            )}
          </div>
        ))}
      </div>

      {saveSuccess && (
        <p className="text-xs text-cyan-400 mb-4">✓ {saveSuccess}</p>
      )}

      {/* Company name (OWNER only) */}
      {ownerMembership && (
        <div className="glass-card rounded-2xl divide-y divide-white/[0.06] mb-6">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 mb-0.5">{t('companyName')}</p>
              {editingCompany ? (
                <div className="flex gap-2 mt-1">
                  <input
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="input-dark flex-1 text-sm"
                    placeholder={t('companyNamePlaceholder')}
                    autoFocus
                  />
                  <button
                    onClick={() => updateCompany.mutate(companyName)}
                    disabled={updateCompany.isPending || !companyName.trim()}
                    className="px-3 py-1.5 btn-primary rounded-lg text-xs font-semibold shrink-0"
                  >{t('saveBtn')}</button>
                  <button onClick={() => setEditingCompany(false)} className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-slate-400 hover:text-white transition-all shrink-0">✕</button>
                </div>
              ) : (
                <p className="text-sm text-white">{ownerMembership.companyName}</p>
              )}
            </div>
            {!editingCompany && (
              <button
                onClick={() => { setCompanyName(ownerMembership.companyName); setEditingCompany(true); }}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors shrink-0"
              >{t('edit')}</button>
            )}
          </div>
        </div>
      )}

      {/* Change Password */}
      <div className="glass-card rounded-2xl p-6 animate-fade-in-up animate-delay-400">
        <h2 className="text-sm font-semibold text-white mb-4">{t('changePasswordBtn')}</h2>
        <div className="space-y-3">
          <input type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} className="input-dark" placeholder={t('currentPasswordPlaceholder')} />
          <input type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} className="input-dark" placeholder={t('newPasswordPlaceholder')} />
          <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} className="input-dark" placeholder={t('confirmPasswordPlaceholder')} />
          {pwError && <p className="text-xs text-red-400">⚠ {pwError}</p>}
          {pwSuccess && <p className="text-xs text-cyan-400">✓ {pwSuccess}</p>}
          <button onClick={handlePasswordSubmit} disabled={!pwForm.current || !pwForm.next || !pwForm.confirm || changePassword.isPending} className="px-5 py-2.5 btn-primary rounded-xl text-sm font-semibold disabled:opacity-50">
            {changePassword.isPending ? t('changing') : t('changePasswordBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
