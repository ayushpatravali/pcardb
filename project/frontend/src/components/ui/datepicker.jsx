import * as React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * DD/MM/YYYY date picker with an app-drawn calendar popup.
 * The native <input type="date"> widget renders per the viewer's OS region
 * (US machines showed mm/dd/yyyy), so we draw our own — identical everywhere.
 * Value in/out is always a "DD/MM/YYYY" string ('' when empty).
 */

const MONTHS = [
    'ಜನವರಿ January', 'ಫೆಬ್ರವರಿ February', 'ಮಾರ್ಚ್ March', 'ಏಪ್ರಿಲ್ April',
    'ಮೇ May', 'ಜೂನ್ June', 'ಜುಲೈ July', 'ಆಗಸ್ಟ್ August',
    'ಸೆಪ್ಟೆಂಬರ್ September', 'ಅಕ್ಟೋಬರ್ October', 'ನವೆಂಬರ್ November', 'ಡಿಸೆಂಬರ್ December',
];
const WEEKDAYS = ['ಸೋ', 'ಮಂ', 'ಬು', 'ಗು', 'ಶು', 'ಶ', 'ಭಾ']; // Mon..Sun

const parseDmy = (s) => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((s || '').trim());
    if (!m) return null;
    const d = new Date(+m[3], +m[2] - 1, +m[1]);
    return (d.getDate() === +m[1] && d.getMonth() === +m[2] - 1) ? d : null;
};
const fmtDmy = (d) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

const mask = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
};

export function DatePicker({ value = '', onChange, placeholder = 'DD/MM/YYYY', className }) {
    const [open, setOpen] = React.useState(false);
    const today = new Date();
    const selected = parseDmy(value);
    const [view, setView] = React.useState({
        y: (selected || today).getFullYear(),
        m: (selected || today).getMonth(),
    });
    const rootRef = React.useRef(null);

    React.useEffect(() => {
        if (open && selected) setView({ y: selected.getFullYear(), m: selected.getMonth() });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    React.useEffect(() => {
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const firstOffset = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Mon = 0
    const years = [];
    for (let y = today.getFullYear() + 1; y >= 1930; y--) years.push(y);

    const nav = (dir) => setView(v => {
        const m = v.m + dir;
        if (m < 0) return { y: v.y - 1, m: 11 };
        if (m > 11) return { y: v.y + 1, m: 0 };
        return { ...v, m };
    });

    const pick = (day) => {
        onChange(fmtDmy(new Date(view.y, view.m, day)));
        setOpen(false);
    };

    return (
        <div ref={rootRef} className={cn('relative', className)}>
            <div className="relative">
                <input
                    value={value}
                    onChange={(e) => onChange(mask(e.target.value))}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    inputMode="numeric"
                    maxLength={10}
                    className="flex w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 pr-10 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setOpen(o => !o)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-stone-400 transition hover:bg-primary-50 hover:text-primary-700"
                >
                    <CalendarIcon size={16} />
                </button>
            </div>

            {open && (
                <div className="absolute z-40 mt-2 w-72 rounded-2xl border border-stone-200 bg-white p-3 shadow-lg">
                    <div className="mb-2 flex items-center gap-1">
                        <button type="button" onClick={() => nav(-1)}
                            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"><ChevronLeft size={16} /></button>
                        <select
                            value={view.m}
                            onChange={(e) => setView(v => ({ ...v, m: +e.target.value }))}
                            className="flex-1 rounded-lg border border-stone-200 bg-white px-1 py-1 text-xs outline-none focus:border-primary-500"
                        >
                            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                        <select
                            value={view.y}
                            onChange={(e) => setView(v => ({ ...v, y: +e.target.value }))}
                            className="w-20 rounded-lg border border-stone-200 bg-white px-1 py-1 text-xs outline-none focus:border-primary-500"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button type="button" onClick={() => nav(1)}
                            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"><ChevronRight size={16} /></button>
                    </div>

                    <div className="grid grid-cols-7 gap-0.5 text-center">
                        {WEEKDAYS.map(w => (
                            <div key={w} className="py-1 text-[10px] font-semibold uppercase text-stone-400">{w}</div>
                        ))}
                        {Array.from({ length: firstOffset }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                            const isSel = selected && selected.getFullYear() === view.y &&
                                selected.getMonth() === view.m && selected.getDate() === day;
                            const isToday = today.getFullYear() === view.y &&
                                today.getMonth() === view.m && today.getDate() === day;
                            return (
                                <button
                                    key={day} type="button" onClick={() => pick(day)}
                                    className={cn(
                                        'rounded-lg py-1.5 text-sm transition',
                                        isSel ? 'bg-primary-700 font-semibold text-white'
                                            : isToday ? 'bg-primary-50 font-semibold text-primary-700 hover:bg-primary-100'
                                                : 'text-stone-700 hover:bg-stone-100'
                                    )}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-2 flex justify-between border-t border-stone-100 pt-2">
                        <button type="button" onClick={() => { onChange(''); setOpen(false); }}
                            className="rounded-lg px-2 py-1 text-xs text-stone-500 hover:bg-stone-100">ಅಳಿಸಿ · Clear</button>
                        <button type="button" onClick={() => { onChange(fmtDmy(today)); setOpen(false); }}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50">ಇಂದು · Today</button>
                    </div>
                </div>
            )}
        </div>
    );
}
