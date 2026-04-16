'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { walletsApi } from '../../../lib/api';

const WALLET_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  btcMainnet: { label: 'Bitcoin (BTC)', icon: '₿', color: 'from-amber-500 to-orange-500' },
  ethErc20: { label: 'Ethereum ERC-20', icon: 'Ξ', color: 'from-blue-400 to-blue-500' },
  ethBep20: { label: 'Ethereum BEP-20', icon: 'Ξ', color: 'from-yellow-400 to-amber-500' },
  usdtErc20: { label: 'USDT ERC-20', icon: '₮', color: 'from-cyan-400 to-teal-500' },
  usdtTrc20: { label: 'USDT TRC-20', icon: '₮', color: 'from-red-400 to-rose-500' },
  usdtBep20: { label: 'USDT BEP-20', icon: '₮', color: 'from-yellow-300 to-amber-400' },
  solMainnet: { label: 'Solana (SOL)', icon: '◎', color: 'from-blue-400 to-purple-600' },
  tonMainnet: { label: 'TON', icon: '💎', color: 'from-sky-400 to-blue-500' },
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all">
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

export default function DonatePage() {
  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletsApi.get().then(r => r.data),
  });

  const entries = wallets ? Object.entries(wallets).filter(([, v]) => v) as [string, string][] : [];
  const [selected, setSelected] = useState<string | null>(null);

  const selectedEntry = entries.find(([key]) => key === selected);
  const selectedMeta = selected ? (WALLET_LABELS[selected] ?? { label: selected, icon: '💳', color: 'from-slate-400 to-slate-500' }) : null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-medium mb-6">
          ♥ Support Us
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Support TrackerHub</h1>
        <p className="text-slate-400 max-w-md mx-auto">
          If our platform helps your team, consider supporting its development. Every contribution keeps the platform free and independent.
        </p>
      </div>

      {entries.length > 0 ? (
        <>
          {/* Wallet selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {entries.map(([key]) => {
              const meta = WALLET_LABELS[key] ?? { label: key, icon: '💳', color: 'from-slate-400 to-slate-500' };
              const isSelected = selected === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelected(isSelected ? null : key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-blue-500/50 bg-blue-500/10'
                      : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {meta.icon}
                  </div>
                  <span className="text-xs text-slate-400 text-center leading-tight">{meta.label}</span>
                </button>
              );
            })}
          </div>

          {/* Selected wallet detail + QR */}
          {selectedEntry && selectedMeta && (
            <div className="glass-card rounded-2xl p-6 mb-4 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                {/* QR code */}
                <div className="shrink-0 bg-white p-3 rounded-xl shadow-lg">
                  <QRCodeSVG value={selectedEntry[1]} size={140} level="M" />
                </div>
                {/* Address info */}
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedMeta.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {selectedMeta.icon}
                    </div>
                    <span className="text-sm font-semibold text-white">{selectedMeta.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1.5">Wallet address</p>
                  <p className="text-xs text-slate-300 font-mono break-all leading-relaxed mb-3">{selectedEntry[1]}</p>
                  <CopyButton value={selectedEntry[1]} />
                </div>
              </div>
            </div>
          )}

          {!selected && (
            <p className="text-center text-sm text-slate-500 mb-4">Select a currency above to see the address and QR code</p>
          )}
        </>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-3xl mb-4">♥</p>
          <p className="text-white font-semibold mb-2">Thank you for your support!</p>
          <p className="text-slate-400 text-sm">Donation details are not available at this time. Please check back later.</p>
        </div>
      )}

      <p className="text-center text-xs text-slate-600 mt-8">
        Your support helps us maintain and improve TrackerHub for everyone.
      </p>
    </div>
  );
}
