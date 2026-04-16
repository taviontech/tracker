'use client';
import { useState, useRef, useEffect } from 'react';
import { FLAG_CDN_BASE_URL, DROPDOWN_FOCUS_DELAY_MS, COUNTRY_SELECT_FOCUS_DELAY_MS } from '../../lib/constants';

interface Country {
  iso: string;
  dial: string;
  name: string;
  mask: string; // # = digit
}

const COUNTRIES: Country[] = [
  { iso: 'RU', dial: '+7',   name: 'Россия',        mask: '(###) ###-##-##' },
  { iso: 'KZ', dial: '+7',   name: 'Казахстан',     mask: '(###) ###-##-##' },
  { iso: 'UA', dial: '+380', name: 'Україна',        mask: '(##) ###-##-##'  },
  { iso: 'BY', dial: '+375', name: 'Беларусь',       mask: '(##) ###-##-##'  },
  { iso: 'UZ', dial: '+998', name: "O'zbekiston",    mask: '(##) ###-##-##'  },
  { iso: 'KG', dial: '+996', name: 'Кыргызстан',    mask: '(###) ###-###'   },
  { iso: 'TJ', dial: '+992', name: 'Тоҷикистон',    mask: '(##) ###-####'   },
  { iso: 'TM', dial: '+993', name: 'Türkmenistan',   mask: '(##) ###-##-##'  },
  { iso: 'AM', dial: '+374', name: 'Армения',        mask: '(##) ###-###'    },
  { iso: 'AZ', dial: '+994', name: 'Azərbaycan',     mask: '(##) ###-##-##'  },
  { iso: 'GE', dial: '+995', name: 'Georgia',        mask: '(###) ###-###'   },
  { iso: 'LV', dial: '+371', name: 'Latvija',        mask: '(##) ###-###'    },
  { iso: 'LT', dial: '+370', name: 'Lietuva',        mask: '(###) ###-##'    },
  { iso: 'EE', dial: '+372', name: 'Eesti',          mask: '(###) ###-###'   },
  { iso: 'US', dial: '+1',   name: 'USA',            mask: '(###) ###-####'  },
  { iso: 'CA', dial: '+1',   name: 'Canada',         mask: '(###) ###-####'  },
  { iso: 'GB', dial: '+44',  name: 'United Kingdom', mask: '#### ######'     },
  { iso: 'DE', dial: '+49',  name: 'Deutschland',    mask: '(###) #######'   },
  { iso: 'FR', dial: '+33',  name: 'France',         mask: '(##) ##-##-##-##'},
  { iso: 'IT', dial: '+39',  name: 'Italia',         mask: '(##) ########'   },
  { iso: 'ES', dial: '+34',  name: 'España',         mask: '### ### ###'     },
  { iso: 'NL', dial: '+31',  name: 'Netherlands',    mask: '## ########'     },
  { iso: 'PL', dial: '+48',  name: 'Polska',         mask: '(##) ###-##-##'  },
  { iso: 'SE', dial: '+46',  name: 'Sverige',        mask: '(##) ### ## ##'  },
  { iso: 'NO', dial: '+47',  name: 'Norge',          mask: '### ## ###'      },
  { iso: 'DK', dial: '+45',  name: 'Danmark',        mask: '## ## ## ##'     },
  { iso: 'FI', dial: '+358', name: 'Suomi',          mask: '## ### ####'     },
  { iso: 'TR', dial: '+90',  name: 'Türkiye',        mask: '(###) ###-##-##' },
  { iso: 'CN', dial: '+86',  name: 'China',          mask: '(###) ####-####' },
  { iso: 'JP', dial: '+81',  name: 'Japan',          mask: '(##) ####-####'  },
  { iso: 'KR', dial: '+82',  name: 'Korea',          mask: '(##) ####-####'  },
  { iso: 'IN', dial: '+91',  name: 'India',          mask: '#####-#####'     },
  { iso: 'AE', dial: '+971', name: 'UAE',            mask: '(##) ###-####'   },
  { iso: 'SA', dial: '+966', name: 'Saudi Arabia',   mask: '(##) ###-####'   },
  { iso: 'IL', dial: '+972', name: 'Israel',         mask: '(##) ###-####'   },
  { iso: 'EG', dial: '+20',  name: 'Egypt',          mask: '(###) ###-####'  },
  { iso: 'ZA', dial: '+27',  name: 'South Africa',   mask: '(##) ###-####'   },
  { iso: 'BR', dial: '+55',  name: 'Brasil',         mask: '(##) #####-####' },
  { iso: 'MX', dial: '+52',  name: 'México',         mask: '(##) ####-####'  },
  { iso: 'AR', dial: '+54',  name: 'Argentina',      mask: '(##) ####-####'  },
  { iso: 'AU', dial: '+61',  name: 'Australia',      mask: '(###) ###-###'   },
  { iso: 'NZ', dial: '+64',  name: 'New Zealand',    mask: '(##) ####-####'  },
];

function maxDigits(mask: string) {
  return mask.split('').filter(c => c === '#').length;
}

/** Applies mask to a digit string. Unfilled positions are replaced with '_'. */
function applyMask(digits: string, mask: string): string {
  let result = '';
  let di = 0;
  for (const ch of mask) {
    if (ch === '#') {
      result += di < digits.length ? digits[di++] : '_';
    } else {
      result += ch;
    }
  }
  return result;
}

/** Returns the masked display string with real digits and '_' for empty positions. */
function displayValue(digits: string, mask: string): string {
  if (digits.length === 0) return '';
  return applyMask(digits, mask);
}

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/** Flag image via flagcdn.com — emoji flags don't render on Windows. */
function FlagImg({ iso }: { iso: string }) {
  return (
    <img
      src={`${FLAG_CDN_BASE_URL}${iso.toLowerCase()}.png`}
      width={20}
      height={14}
      alt={iso}
      style={{ display: 'inline-block', flexShrink: 0 }}
    />
  );
}

export default function PhoneInput({ value, onChange }: Props) {
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [digits, setDigits] = useState('');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const max = maxDigits(country.mask);

  // Initialise from external value on mount
  useEffect(() => {
    if (value && digits === '') {
      const found = COUNTRIES.find(c => value.startsWith(c.dial));
      if (found) {
        setCountry(found);
        const raw = value.slice(found.dial.length).replace(/\D/g, '');
        setDigits(raw.slice(0, maxDigits(found.mask)));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), DROPDOWN_FOCUS_DELAY_MS);
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = digits.slice(0, -1);
      setDigits(next);
      onChange(`${country.dial} ${next}`);
      return;
    }
    if (e.key === 'Tab' || e.key === 'Enter') return;
    if (!/^\d$/.test(e.key)) { e.preventDefault(); return; }
    if (digits.length >= max) { e.preventDefault(); return; }
    const next = digits + e.key;
    setDigits(next);
    onChange(`${country.dial} ${next}`);
  }

  function selectCountry(c: Country) {
    setCountry(c);
    setOpen(false);
    setSearch('');
    // Trim digits if the new country mask is shorter
    const nextDigits = digits.slice(0, maxDigits(c.mask));
    setDigits(nextDigits);
    onChange(`${c.dial} ${nextDigits}`);
    setTimeout(() => inputRef.current?.focus(), COUNTRY_SELECT_FOCUS_DELAY_MS);
  }

  const filtered = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search) ||
        c.iso.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  const displayStr = displayValue(digits, country.mask);
  const isFull = digits.length === max;

  return (
    <div className="relative flex" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 shrink-0 border border-white/[0.1] border-r-0 rounded-l-[10px] transition-colors"
        style={{
          minWidth: '96px',
          background: 'rgba(255,255,255,0.05)',
        }}
      >
        <FlagImg iso={country.iso} />
        <span className="text-slate-300 text-sm font-medium tabular-nums">{country.dial}</span>
        <svg
          className={`w-3 h-3 text-slate-500 transition-transform duration-200 ml-auto ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div
        className="flex-1 relative border border-white/[0.1] rounded-r-[10px] cursor-text"
        style={{ background: 'rgba(255,255,255,0.05)' }}
        onClick={() => inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayStr}
          onKeyDown={handleKeyDown}
          onChange={() => {}}  // controlled via onKeyDown
          placeholder={country.mask.replace(/#/g, '_')}
          readOnly={false}
          className="w-full h-full bg-transparent outline-none px-3 py-[0.625rem] text-sm tabular-nums"
          style={{
            color: digits.length > 0 ? '#f1f5f9' : undefined,
            caretColor: 'transparent',
          }}
        />
        {digits.length > 0 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="text-xs tabular-nums" style={{ color: isFull ? '#22d3ee' : '#64748b' }}>
              {digits.length}/{max}
            </span>
            {isFull && (
              <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
      </div>

      {open && (
        <div
          className="absolute left-0 z-[200] rounded-xl border border-white/[0.12] shadow-2xl shadow-black/60 overflow-hidden"
          style={{ top: 'calc(100% + 4px)', width: '280px', background: '#0d1526' }}
        >
          <div className="p-2 border-b border-white/[0.08]">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full text-sm px-3 py-2 rounded-lg outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f1f5f9',
              }}
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '220px' }}>
            {filtered.length === 0 ? (
              <div className="px-4 py-5 text-center text-slate-600 text-sm">Nothing found</div>
            ) : filtered.map(c => {
              const active = country.iso === c.iso && country.dial === c.dial;
              return (
                <button
                  key={`${c.iso}-${c.dial}`}
                  type="button"
                  onClick={() => selectCountry(c)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                  style={{
                    background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                    color: active ? '#a5b4fc' : '#cbd5e1',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <FlagImg iso={c.iso} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-slate-500 tabular-nums text-xs shrink-0">{c.dial}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
