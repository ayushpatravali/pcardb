import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import api, { getApplication, updateApplication } from '../services/api';
import React from 'react';
import { FileText, Car, Sprout, Clipboard, ChevronRight, Save, Plus, Trash2, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/datepicker';
import { useLanguage } from '../context/LanguageContext';
import { knLabel, knOption, hasKannada } from '@/lib/kannada';
import { calculateTractorLoanSummary } from '../utils/tractorFormCalculations.mjs';
import { calculateTractorLoanFields } from '../utils/tractorCalculations';

// ── Scheme Config ─────────────────────────────────────────────────────────────
const SCHEME_CONFIG = {
    'TRACTOR':  { titleKey: 'tractorScheme', title: 'Tractor Purchase Scheme',   icon: <Car size={32} />,       gradient: 'from-primary-800 to-primary-950',  color: 'blue'   },
    'LAND_DEV': { titleKey: 'landScheme',    title: 'Land Development Scheme',    icon: <Sprout size={32} />,    gradient: 'from-emerald-700 to-primary-950',  color: 'green'  },
    'SHEEP_40': { titleKey: 'sheep40',       title: 'Sheep Rearing (40+2)',       icon: <Clipboard size={32} />, gradient: 'from-primary-700 to-primary-900',  color: 'indigo' },
    'SHEEP_20': { titleKey: 'sheep20',       title: 'Sheep Rearing (20+1)',       icon: <Clipboard size={32} />, gradient: 'from-primary-700 to-primary-900',  color: 'purple' },
    'SHEEP_10': { titleKey: 'sheep10',       title: 'Sheep Rearing (10+1)',       icon: <Clipboard size={32} />, gradient: 'from-primary-600 to-primary-900',  color: 'indigo' },
    'BULLOCK':  { titleKey: 'bullockScheme', title: 'Bullock & Cart Scheme',      icon: <FileText size={32} />,  gradient: 'from-accent-600 to-accent-900',    color: 'orange' },
};

// Land Dev's 6 development-work line items are fixed (matches the bank's
// reference packet); only the per-acre rate varies per application.
const DEV_WORK_DESCRIPTIONS = [
    'ಗಿಡಗಂಟೆ, ಕಲ್ಲು ಕಂಟಿಗಳನ್ನು ತೆಗೆದು ಜಮೀನು ಸ್ವಚ್ಛಗೊಳಿಸುವುದು ಮತ್ತು ಕೊರಕಲುಗಳನ್ನು ತುಂಬುವುದು',
    'ಜಮೀನಿನ ವಿಂಗಡಣೆ, ಸಮತಳ ಮತ್ತು ಮಟ್ಟಿಗೊಳಿಸುವುದು',
    'ಮೇರೆ / ಅಂಚುಗಳಿಗೆ ಒಡ್ಡುಗಳನ್ನು ಹಾಕುವುದು',
    'ಹೆಚ್ಚಿನ ನೀರು ಹೊರಹೋಗಲು ಒಳಗಟ್ಟಿ ನಿರ್ಮಿಸುವುದು',
    'ಫಲವತ್ತಾದ ಕೆರೆ ಮಣ್ಣು ಮತ್ತು ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಸಂಗ್ರಹಣೆ ಮತ್ತು ಹರಡುವುದು',
    'ಕಾಣಬರದ ಇತರ ಕಾರ್ಯಗಳು',
];
// Bank-fixed per-acre rates for the six works (owner, 2026-08-06; matches
// LD1 sheet of Appraisal LD.xlsx). Locked — operators cannot edit them.
const DEV_WORK_RATES = [5336, 61714, 7807, 0, 3429, 1714];
const LAND_TYPE_OPTIONS = ['ಖುಷ್ಕಿ', 'ತರಿ'];

// ── Dropdown Options ──────────────────────────────────────────────────────────
// Authoritative per-acre annual income (Rs) - transcribed exactly from the
// bank's "CROP INCOME CHART.xlsx" (31 crops). Stored crop value IS the Kannada
// chart name, so names and rates can never drift apart.
const CROP_CHART = {
    'ಭತ್ತ': 17400,
    'ಮುಸುಕಿನಜೋಳ': 19500,
    'ಸೇಂಗಾ': 32550,
    'ಹೈಬ್ರಿಡ್ ಹತ್ತಿ': 21900,
    'ಸೂರ್ಯಕಾಂತಿ': 14800,
    'ಹೈಬ್ರಿಡ್ ಜೋಳ': 29200,
    'ಗೋಧಿ': 15790,
    'ತಂಬಾಕು': 22400,
    'ದ್ವಿದಳ ಧಾನ್ಯ': 15500,
    'ಕಬ್ಬು': 83000,
    'ರೇಷ್ಮೆ (ಸಾಂ)': 72500,
    'ರೇಷ್ಮೆ (ಕಾಂ)': 121250,
    'ತೆಂಗು (ಕಾಯಿ)': 24150,
    'ಮಾವು': 50266,
    'ಚಿಕ್ಕು': 31600,
    'ಬಾಳೆ': 50200,
    'ದಾಳಿಂಬೆ': 33400,
    'ಪಪ್ಪಾಯ': 42400,
    'ಲಿಂಬೆ': 23000,
    'ದ್ರಾಕ್ಷಿ (ಬೀಜ ರಹಿತ)': 172500,
    'ಬೋರೆ': 17600,
    'ಗುಲಾಬಿ (ಸಂಖ್ಯೆ)': 54800,
    'ವಿಳ್ಯದೆಲೆ': 46000,
    'ಕಲ್ಲಂಗಡಿ': 46800,
    'ತರಕಾರಿಗಳು': 31200,
    'ಅರಿಷಿಣ': 52500,
    'ಒಣ ಮೆಣಸಿನಕಾಯಿ': 25500,
    'ಈರುಳ್ಳಿ': 29000,
    'ಬೆಳ್ಳುಳ್ಳಿ': 27500,
    'ಆಲೂಗಡ್ಡೆ': 40000,
    'ಸೇವಂತಿಗೆ': 31000,
};

// Full per-crop economics from CROP INCOME CHART for land dev.xlsx
// (2026-08-06): [yield quintals/acre, market rate ₹, cultivation expenditure
// ₹/acre]. Net/acre = yield x rate - expenditure == CROP_CHART value above
// (verified for all 31). Feeds the ಕ್ಷೇತ್ರ ಆಯವ್ಯಯ ತಃಖ್ತೆ (Ap3) columns for
// LAND_DEV pre/post-development crop rows.
const CROP_ECON = {
    'ಭತ್ತ': [20, 2600, 34600], 'ಮುಸುಕಿನಜೋಳ': [20, 2025, 21000],
    'ಸೇಂಗಾ': [11, 4750, 19700], 'ಹೈಬ್ರಿಡ್ ಹತ್ತಿ': [6.5, 7600, 27500],
    'ಸೂರ್ಯಕಾಂತಿ': [7, 4500, 16700], 'ಹೈಬ್ರಿಡ್ ಜೋಳ': [15, 3100, 17300],
    'ಗೋಧಿ': [10, 2800, 12210], 'ತಂಬಾಕು': [8, 7800, 40000],
    'ದ್ವಿದಳ ಧಾನ್ಯ': [6, 6000, 20500], 'ಕಬ್ಬು': [500, 275, 54500],
    'ರೇಷ್ಮೆ (ಸಾಂ)': [4.2, 37500, 85000], 'ರೇಷ್ಮೆ (ಕಾಂ)': [6.3, 37500, 115000],
    'ತೆಂಗು (ಕಾಯಿ)': [4800, 15, 47850], 'ಮಾವು': [50, 2300, 64734],
    'ಚಿಕ್ಕು': [35, 2200, 45400], 'ಬಾಳೆ': [96, 1200, 65000],
    'ದಾಳಿಂಬೆ': [30, 2880, 53000], 'ಪಪ್ಪಾಯ': [120, 1000, 77600],
    'ಲಿಂಬೆ': [42, 1500, 40000], 'ದ್ರಾಕ್ಷಿ (ಬೀಜ ರಹಿತ)': [115, 3100, 184000],
    'ಬೋರೆ': [58, 1200, 52000], 'ಗುಲಾಬಿ (ಸಂಖ್ಯೆ)': [92000, 1.9, 120000],
    'ವಿಳ್ಯದೆಲೆ': [12, 12000, 98000], 'ಕಲ್ಲಂಗಡಿ': [120, 1150, 91200],
    'ತರಕಾರಿಗಳು': [68, 900, 30000], 'ಅರಿಷಿಣ': [25, 6000, 97500],
    'ಒಣ ಮೆಣಸಿನಕಾಯಿ': [7.5, 15000, 87000], 'ಈರುಳ್ಳಿ': [60, 1350, 52000],
    'ಬೆಳ್ಳುಳ್ಳಿ': [15, 3500, 25000], 'ಆಲೂಗಡ್ಡೆ': [60, 1800, 68000],
    'ಸೇವಂತಿಗೆ': [40, 2900, 85000],
};

// English glosses for the bilingual (default) mode only; Kannada mode strips them.
const CROP_EN_GLOSS = {
    'ಭತ್ತ': 'Paddy', 'ಮುಸುಕಿನಜೋಳ': 'Maize', 'ಸೇಂಗಾ': 'Groundnut',
    'ಹೈಬ್ರಿಡ್ ಹತ್ತಿ': 'Hybrid Cotton', 'ಸೂರ್ಯಕಾಂತಿ': 'Sunflower',
    'ಹೈಬ್ರಿಡ್ ಜೋಳ': 'Hybrid Jowar', 'ಗೋಧಿ': 'Wheat', 'ತಂಬಾಕು': 'Tobacco',
    'ದ್ವಿದಳ ಧಾನ್ಯ': 'Pulses', 'ಕಬ್ಬು': 'Sugarcane', 'ರೇಷ್ಮೆ (ಸಾಂ)': 'Silk',
    'ರೇಷ್ಮೆ (ಕಾಂ)': 'Silk Hybrid', 'ತೆಂಗು (ಕಾಯಿ)': 'Coconut', 'ಮಾವು': 'Mango',
    'ಚಿಕ್ಕು': 'Sapota', 'ಬಾಳೆ': 'Banana', 'ದಾಳಿಂಬೆ': 'Pomegranate',
    'ಪಪ್ಪಾಯ': 'Papaya', 'ಲಿಂಬೆ': 'Lemon', 'ದ್ರಾಕ್ಷಿ (ಬೀಜ ರಹಿತ)': 'Seedless Grapes',
    'ಬೋರೆ': 'Ber', 'ಗುಲಾಬಿ (ಸಂಖ್ಯೆ)': 'Rose', 'ವಿಳ್ಯದೆಲೆ': 'Betel Leaf',
    'ಕಲ್ಲಂಗಡಿ': 'Watermelon', 'ತರಕಾರಿಗಳು': 'Vegetables', 'ಅರಿಷಿಣ': 'Turmeric',
    'ಒಣ ಮೆಣಸಿನಕಾಯಿ': 'Dry Chilli', 'ಈರುಳ್ಳಿ': 'Onion', 'ಬೆಳ್ಳುಳ್ಳಿ': 'Garlic',
    'ಆಲೂಗಡ್ಡೆ': 'Potato', 'ಸೇವಂತಿಗೆ': 'Chrysanthemum',
};

const CROP_OPTIONS = [
    { value: '', label: '' },
    ...Object.keys(CROP_CHART).map(kn => ({
        value: kn,
        label: CROP_EN_GLOSS[kn] ? `${kn} (${CROP_EN_GLOSS[kn]})` : kn,
    })),
];

// Legacy compatibility: rows saved before 2026-08-03 stored English crop values
// (and some stored the old bilingual labels). Map them to the chart names so
// editing an old application still selects and rates correctly.
const CROP_LABEL_MAP = {
    'Sugarcane': 'ಕಬ್ಬು', 'Rice': 'ಭತ್ತ', 'Jowar': 'ಹೈಬ್ರಿಡ್ ಜೋಳ',
    'Maize': 'ಮುಸುಕಿನಜೋಳ', 'Wheat': 'ಗೋಧಿ', 'Cotton': 'ಹೈಬ್ರಿಡ್ ಹತ್ತಿ',
    'Groundnut': 'ಸೇಂಗಾ', 'Sunflower': 'ಸೂರ್ಯಕಾಂತಿ', 'Onion': 'ಈರುಳ್ಳಿ',
    'Banana': 'ಬಾಳೆ', 'Grapes': 'ದ್ರಾಕ್ಷಿ (ಬೀಜ ರಹಿತ)',
    'ಕಬ್ಬು (Sugarcane)': 'ಕಬ್ಬು', 'ಭತ್ತ (Rice)': 'ಭತ್ತ',
    'ಜೋಳ (Jowar)': 'ಹೈಬ್ರಿಡ್ ಜೋಳ', 'ಮೆಕ್ಕೆ ಜೋಳ (Maize)': 'ಮುಸುಕಿನಜೋಳ',
    'ಗೋಧಿ (Wheat)': 'ಗೋಧಿ', 'ಹತ್ತಿ (Cotton)': 'ಹೈಬ್ರಿಡ್ ಹತ್ತಿ',
    'ಶೇಂಗಾ (Groundnut)': 'ಸೇಂಗಾ', 'ಸೂರ್ಯಕಾಂತಿ (Sunflower)': 'ಸೂರ್ಯಕಾಂತಿ',
    'ಈರುಳ್ಳಿ (Onion)': 'ಈರುಳ್ಳಿ', 'ಬಾಳೆ (Banana)': 'ಬಾಳೆ',
    'ದ್ರಾಕ್ಷಿ (Grapes)': 'ದ್ರಾಕ್ಷಿ (ಬೀಜ ರಹಿತ)',
    // Soybean / Tomato / Chilli / Other have no chart entry: kept as typed,
    // their stored income is preserved (no rate available).
};

const IRRIGATION_OPTIONS = [
    'ಕೊಳವೆ ಬಾವಿ (Borewell)', 'ತೆರೆದ ಬಾವಿ (Open Well)', 'ಕಾಲುವೆ (Canal)',
    'ಕೆರೆ (Tank)', 'ನದಿ (River)', 'ಏತ ನೀರಾವರಿ (Lift Irrigation)',
    'ಮಳೆಯಾಶ್ರಿತ (Rain-fed)', 'ಇತರೆ (Other)'
];

// Caste list transcribed exactly from CROP INCOME CHART.xlsx (bank's own
// spellings, e.g. ಪರಿಶಿಷ್ಠ) — the stored value prints verbatim on the packet.
const CASTE_OPTIONS = [
    'ಪರಿಶಿಷ್ಠ ಜಾತಿ', 'ಪರಿಶಿಷ್ಠ ಪಂಗಡ', 'ಅಲ್ಪ ಸಂಖ್ಯಾತರು', 'ಇತರೆ ಸಾಮಾನ್ಯ',
    'ದಿಗಂಬರ ಜೈನ', 'ಮುಸ್ಲಿಂ', 'ಹಿಂದೂ ರಡ್ಡಿ', 'ಹಿಂದೂ ಮಾಳಿ', 'ಹಿಂದೂ ಬಣಜಿಗ',
    'ಹಿಂದೂ ಕುರಬರ', 'ಹಿಂದೂ ಲಿಂಗವಂತ', 'ಹಿಂದೂ ಉಪ್ಪಾರ',
];
const CASTE_OTHER = '__other__';
// Legacy stored values from the old dropdown -> chart equivalents (exact only)
const CASTE_LEGACY_MAP = {
    'General / ಸಾಮಾನ್ಯ': 'ಇತರೆ ಸಾಮಾನ್ಯ',
    'SC / ಪರಿಶಿಷ್ಟ ಜಾತಿ': 'ಪರಿಶಿಷ್ಠ ಜಾತಿ',
    'ST / ಪರಿಶಿಷ್ಟ ಪಂಗಡ': 'ಪರಿಶಿಷ್ಠ ಪಂಗಡ',
};
const FARMER_OPTIONS = ['ಸಣ್ಣ ರೈತ (Small)', 'ದೊಡ್ಡ ರೈತ (Big)', 'ಅತಿ ಸಣ್ಣ ರೈತ (Marginal)'];
const RELATION_OPTIONS = ['', 'ಪತ್ನಿ/ಪತಿ (Spouse)', 'ಮಗ (Son)', 'ಮಗಳು (Daughter)', 'ತಂದೆ (Father)', 'ತಾಯಿ (Mother)', 'ಸಹೋದರ (Brother)', 'ಇತರೆ (Other)'];

// ── Reusable Components ───────────────────────────────────────────────────────
// Tailwind can't compile dynamic `border-${color}-100` classes — explicit map.
const SECTION_TONES = {
    gray:   { chip: 'bg-stone-100 text-stone-600' },
    blue:   { chip: 'bg-primary-100 text-primary-700' },
    green:  { chip: 'bg-emerald-100 text-emerald-700' },
    orange: { chip: 'bg-accent-100 text-accent-700' },
    indigo: { chip: 'bg-primary-100 text-primary-700' },
    purple: { chip: 'bg-primary-100 text-primary-700' },
    amber:  { chip: 'bg-accent-100 text-accent-700' },
    red:    { chip: 'bg-red-100 text-red-700' },
    teal:   { chip: 'bg-primary-100 text-primary-700' },
};

const SectionHeader = ({ title, icon, color = 'gray' }) => {
    const tone = SECTION_TONES[color] || SECTION_TONES.gray;
    const { language } = useLanguage();
    return (
        <div className="flex items-center mb-6 pb-3 border-b border-stone-200">
            <div className={`p-2 rounded-lg mr-3 ${tone.chip}`}>
                {icon || <ChevronRight size={18} />}
            </div>
            <h3 className="text-lg font-bold text-stone-800 tracking-tight">{language === 'kn' ? knLabel(title) : title}</h3>
        </div>
    );
};

// variant: 'default' | 'dark' (on deep-green panels) | 'highlight' (key totals)
// Wraps the shadcn Input primitive; register spread is passed through untouched.
const InputField = ({ label, register, type = 'text', placeholder, step, readOnly, className = '', inputProps = {}, variant = 'default' }) => {
    if (type === 'number' && step === undefined) step = 'any';
    const { language } = useLanguage();
    if (language === 'kn') {
        label = knLabel(label);
        if (placeholder === '10 digit number') placeholder = '10 ಅಂಕಿಗಳು';
        else if (placeholder === '12 digit number') placeholder = '12 ಅಂಕಿಗಳು';
        else if (placeholder && !hasKannada(placeholder) && !/^₹|\//.test(placeholder)) placeholder = undefined;
    }
    const labelCls = (variant === 'dark' || variant === 'highlight')
        ? 'text-primary-200'
        : 'text-stone-500 group-focus-within:text-primary-700';
    let inputCls = '';
    if (variant === 'highlight') {
        inputCls = 'read-only:bg-accent-300 read-only:text-primary-950 read-only:border-accent-400 bg-accent-300 text-primary-950 font-bold border-accent-400 cursor-not-allowed';
    } else if (variant === 'dark') {
        inputCls = readOnly
            ? 'read-only:bg-white/10 read-only:text-white read-only:border-white/10 font-bold cursor-not-allowed'
            : 'bg-white/10 text-white border-white/20 placeholder:text-primary-300 focus:border-accent-300 focus:ring-accent-300/30';
    }
    return (
        <div className={`group flex h-full flex-col ${className}`}>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 transition-colors ${labelCls}`}>
                {label}
            </label>
            <Input
                type={type} step={step}
                min={type === 'number' ? '0' : undefined}
                onWheel={(e) => type === 'number' && e.target.blur()}
                placeholder={placeholder}
                readOnly={readOnly}
                {...register}
                {...inputProps}
                className={`mt-auto ${inputCls}`}
            />
        </div>
    );
};

const SelectField = ({ label, register, options, className = '' }) => {
    const { language } = useLanguage();
    return (
    <div className={`group flex h-full flex-col ${className}`}>
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 group-focus-within:text-primary-700 transition-colors">
            {language === 'kn' ? knLabel(label) : label}
        </label>
        <div className="relative mt-auto">
            <select {...register}
                className="w-full px-4 py-2.5 bg-white text-stone-900 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none appearance-none transition-all text-sm">
                {options.map(opt => {
                    const value = typeof opt === 'string' ? opt : opt.value;
                    let labelText = typeof opt === 'string' ? opt : opt.label;
                    if (language === 'kn') labelText = knOption(labelText);
                    return <option key={value} value={value}>{labelText}</option>;
                })}
            </select>
            <div className="absolute right-3 top-3 text-stone-400 pointer-events-none">
                <ChevronRight size={16} className="rotate-90" />
            </div>
        </div>
    </div>
    );
};

// The browser's native date picker renders per-viewer locale (US machines
// showed mm/dd/yyyy on the same deployed URL), so dates are typed as plain
// DD/MM/YYYY text — identical on every machine. Converted to ISO for the API.
const dmyToIso = (s) => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((s || '').trim());
    if (!m) return null;
    const [, d, mo, y] = m;
    if (+mo < 1 || +mo > 12 || +d < 1 || +d > 31) return null;
    return `${y}-${mo}-${d}`;
};
const isoToDmy = (s) => {
    if (!s) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(s);
};
const dmyMask = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let out = digits;
    if (digits.length > 4) out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2) out = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    e.target.value = out;
};

const getCropRate = (cropName) => {
    if (!cropName) return 0;
    const normalized = cropName?.toString().trim();
    if (!normalized) return 0;
    if (CROP_CHART[normalized]) return CROP_CHART[normalized];
    return CROP_CHART[CROP_LABEL_MAP[normalized]] || 0;
};

const getCropEcon = (cropName) => {
    const normalized = cropName?.toString().trim();
    if (!normalized) return null;
    return CROP_ECON[normalized] || CROP_ECON[CROP_LABEL_MAP[normalized]] || null;
};

const parseJsonArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const normalizeCropName = (cropName) => {
    if (!cropName) return '';
    const raw = cropName.toString().trim();
    if (!raw) return '';
    if (CROP_CHART[raw]) return raw;
    if (CROP_LABEL_MAP[raw]) return CROP_LABEL_MAP[raw];
    const normalizedKey = Object.keys(CROP_LABEL_MAP).find(
        (label) => label.toString().trim().toLowerCase() === raw.toLowerCase()
    );
    return normalizedKey ? CROP_LABEL_MAP[normalizedKey] : raw;
};

const sanitizeIrrigationKey = (source) => {
    return source?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
};

const parseIrrigationSourceField = (value) => {
    if (!value) return { sources: [], hp: {} };
    const list = typeof value === 'string'
        ? value.split(',').map(item => item.trim()).filter(Boolean)
        : Array.isArray(value)
            ? value
            : [];

    const sources = [];
    const hp = {};
    list.forEach((item) => {
        const match = item.match(/^(.*?)[\s]*\((\d+(?:\.\d*)?)\s*HP\)$/i);
        if (match) {
            const source = match[1].trim();
            sources.push(source);
            hp[sanitizeIrrigationKey(source)] = match[2];
        } else {
            sources.push(item);
        }
    });
    return { sources, hp };
};

// ── Main Component ────────────────────────────────────────────────────────────
const NewApplication = () => {
    const [searchParams] = useSearchParams();
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    // Kannada-only mode: strip the English halves of bilingual display strings
    const L = React.useCallback((s) => (language === 'kn' ? knLabel(s) : s), [language]);

    const [schemeType, setSchemeType] = React.useState(searchParams.get('scheme') || 'TRACTOR');
    const config = SCHEME_CONFIG[schemeType] || SCHEME_CONFIG['TRACTOR'];

    const { register, handleSubmit, setValue, reset, watch, control, formState: { errors } } = useForm({
        defaultValues: {
            scheme_type: schemeType,
            farmer_type: FARMER_OPTIONS[0],
            caste: 'ಇತರೆ ಸಾಮಾನ್ಯ',
            land_parcels: [{ sl: '1', village: '', survey_no: '', acres: '', guntas: '', akaar: '' }],
            crops: [{ crop_name: '', acres: '', guntas: '', annual_income: '' }],
            pre_dev_crops: [{ crop_name: '', season: '', irrigated: '', acres: '', guntas: '', annual_income: '' }],
            post_dev_crops: [{ crop_name: '', season: '', irrigated: '', acres: '', guntas: '', annual_income: '' }],
            land_type: LAND_TYPE_OPTIONS[1],
            dev_work_rates: DEV_WORK_RATES,
            irrigation_source: [],
            irrigation_hp: {},
            loan_duration_years: 7,
        }
    });

    // Land parcels dynamic rows
    const { fields: landFields, append: landAppend, remove: landRemove } = useFieldArray({
        control, name: 'land_parcels'
    });

    // Crops dynamic rows
    const { fields: cropsFields, append: cropsAppend, remove: cropsRemove } = useFieldArray({
        control, name: 'crops'
    });

    // LAND_DEV: two crop lists (before/after development)
    const { fields: preDevCropsFields, append: preDevCropsAppend, remove: preDevCropsRemove } = useFieldArray({
        control, name: 'pre_dev_crops'
    });
    const { fields: postDevCropsFields, append: postDevCropsAppend, remove: postDevCropsRemove } = useFieldArray({
        control, name: 'post_dev_crops'
    });

    // Co-applicants dynamic rows
    const { fields: coAppFields, append: coAppAppend, remove: coAppRemove } = useFieldArray({
        control, name: 'co_applicants'
    });

    // ── Draft autosave (new applications only) ──────────────────────────────
    // The save POST is this form's FIRST server contact, so a dead login used
    // to surface only after all the typing — and lose it (bit a tester on
    // 2026-08-06). Every change is snapshotted locally, restored when the
    // same scheme's blank form reopens, and cleared on successful save.
    const draftKey = `pcardb_draft_${schemeType}`;
    React.useEffect(() => {
        if (id) return; // edits load from the server, not from drafts
        try {
            const saved = localStorage.getItem(draftKey);
            if (saved) reset({ ...JSON.parse(saved), scheme_type: schemeType });
        } catch { /* corrupt draft — start blank */ }
        const sub = watch((values) => {
            try { localStorage.setItem(draftKey, JSON.stringify(values)); } catch { /* storage full */ }
        });
        return () => sub.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, draftKey]);

    // Watch for auto-calculations
    const tractor_q   = watch('tractor_quotation');
    const tractor_dp  = watch('tractor_down_payment');
    const trailer_q   = watch('trailer_quotation');
    const trailer_dp  = watch('trailer_down_payment');
    const implement_q = watch('implement_quotation');
    const implement_dp= watch('implement_down_payment');
    
    const sh_animal = watch('animal_cost');
    const sh_shed   = watch('shed_cost');
    const sh_feed   = watch('feed_cost');
    const sh_ins    = watch('insurance_amt');
    const sh_misc   = watch('misc_cost');
    const bu_bullock = watch('bullock_cost');
    const bu_cart    = watch('cart_cost');
    const bu_loan    = watch('bullock_loan_amount');
    const landParcels = watch('land_parcels', []);
    const landValuationRate = watch('land_valuation_per_acre');
    const borrowerTypeSel = watch('borrower_type');
    const isOldBorrower = typeof borrowerTypeSel === 'string' && borrowerTypeSel.includes('Old');
    const cropsData = watch('crops', []);
    const irrigationSource = watch('irrigation_source');
    const preDevCropsData = watch('pre_dev_crops', []);
    const postDevCropsData = watch('post_dev_crops', []);
    const devWorkRates = watch('dev_work_rates', []);

    const calculateCropIncomes = React.useCallback((rows = [], fieldArrayName = 'crops') => {
        if (!Array.isArray(rows)) return;
        rows.forEach((crop, index) => {
            const cropName = crop?.crop_name;
            const acres = parseFloat(crop?.acres) || 0;
            const guntas = parseFloat(crop?.guntas) || 0;
            const rate = getCropRate(cropName);
            const totalAcres = acres + (guntas / 40);
            // No chart rate (legacy/unknown crop): keep the stored income as-is.
            if (rate > 0) {
                setValue(`${fieldArrayName}.${index}.annual_income`, Math.round(totalAcres * rate));
            } else if (!cropName) {
                setValue(`${fieldArrayName}.${index}.annual_income`, '');
            }
        });
    }, [setValue]);

    // LAND_DEV pre/post-dev rows: fill every ಕ್ಷೇತ್ರ ಆಯವ್ಯಯ ತಃಖ್ತೆ column from
    // the chart economics. Chain mirrors the bank's reference sheet: total
    // cost = cost/acre x extent; total yield = round(yield x extent); total
    // income = total yield x market rate; net = income - cost.
    const calculateCropEconomics = React.useCallback((rows = [], fieldArrayName) => {
        if (!Array.isArray(rows)) return;
        rows.forEach((crop, index) => {
            const econ = getCropEcon(crop?.crop_name);
            const acres = parseFloat(crop?.acres) || 0;
            const guntas = parseFloat(crop?.guntas) || 0;
            const ext = acres + guntas / 40;
            if (!econ) {
                // No chart entry (legacy/free-text crop): keep stored values.
                if (!crop?.crop_name) setValue(`${fieldArrayName}.${index}.annual_income`, '');
                return;
            }
            const [yieldPerAcre, marketRate, costPerAcre] = econ;
            const totalCost = Math.round(costPerAcre * ext);
            const totalYield = Math.round(yieldPerAcre * ext);
            const totalIncome = Math.round(totalYield * marketRate);
            setValue(`${fieldArrayName}.${index}.cost_per_acre`, costPerAcre);
            setValue(`${fieldArrayName}.${index}.total_cost`, ext > 0 ? totalCost : 0);
            setValue(`${fieldArrayName}.${index}.yield_per_acre`, yieldPerAcre);
            setValue(`${fieldArrayName}.${index}.total_yield`, ext > 0 ? totalYield : 0);
            setValue(`${fieldArrayName}.${index}.rate`, marketRate);
            setValue(`${fieldArrayName}.${index}.total_income`, ext > 0 ? totalIncome : 0);
            setValue(`${fieldArrayName}.${index}.annual_income`, ext > 0 ? totalIncome - totalCost : 0);
        });
    }, [setValue]);

    const calculateLandTotals = React.useCallback((rows = [], valuationRate) => {
        if (!Array.isArray(rows)) return;
        const totalAcres = rows.reduce((sum, row) => sum + (parseFloat(row?.acres) || 0), 0);
        const totalGuntas = rows.reduce((sum, row) => sum + (parseFloat(row?.guntas) || 0), 0);
        const extraAcres = Math.floor(totalGuntas / 40);
        const finalGuntas = totalGuntas % 40;
        const finalAcres = totalAcres + extraAcres;
        const totalAkaar = rows.reduce((sum, row) => sum + (parseFloat(row?.akaar) || 0), 0);

        setValue('total_area_acres', finalAcres.toFixed(2));
        setValue('total_guntas', finalGuntas);
        setValue('total_akaar', totalAkaar.toFixed(2));

        // Per-parcel land valuation (TRACTOR): per-acre rate x parcel extent. Locked field.
        const rate = parseFloat(valuationRate) || 0;
        let valuationTotal = 0;
        rows.forEach((row, index) => {
            const extent = (parseFloat(row?.acres) || 0) + ((parseFloat(row?.guntas) || 0) / 40);
            const valuation = rate > 0 && extent > 0 ? Math.round(rate * extent) : '';
            if (valuation !== '') valuationTotal += valuation;
            setValue(`land_parcels.${index}.valuation`, valuation);
        });
        setValue('total_land_valuation', valuationTotal > 0 ? valuationTotal : '');
    }, [setValue]);

    // Auto-calculate totals
    React.useEffect(() => {
        if (schemeType === 'TRACTOR') {
            const t_q = parseFloat(tractor_q) || 0;
            const t_dp = parseFloat(tractor_dp) || 0;
            const t_loan = Math.max(0, t_q - t_dp);
            setValue('tractor_bank_loan', t_loan);

            const tr_q = parseFloat(trailer_q) || 0;
            const tr_dp = parseFloat(trailer_dp) || 0;
            const tr_loan = Math.max(0, tr_q - tr_dp);
            setValue('trailer_bank_loan', tr_loan);

            const i_q = parseFloat(implement_q) || 0;
            const i_dp = parseFloat(implement_dp) || 0;
            const i_loan = Math.max(0, i_q - i_dp);
            setValue('implement_bank_loan', i_loan);

            const total_q = t_q + tr_q + i_q;
            const total_dp = t_dp + tr_dp + i_dp;
            const total_loan = t_loan + tr_loan + i_loan;

            setValue('total_quotation', total_q);
            setValue('total_down_payment', total_dp);
            setValue('total_loan_amount', total_loan);
            
            // Set global loan amount
            setValue('loan_amount', total_loan);
            
        } else if (schemeType.includes('SHEEP')) {
            const total = [sh_animal, sh_shed, sh_feed, sh_ins, sh_misc]
                .map(v => parseFloat(v) || 0).reduce((a, b) => a + b, 0);
            setValue('sheep_total_cost', total);
        } else if (schemeType === 'BULLOCK') {
            const total = (parseFloat(bu_bullock) || 0) + (parseFloat(bu_cart) || 0);
            setValue('bullock_total_cost', total);
            const loan = parseFloat(bu_loan) || 0;
            if (total > 0) setValue('bullock_margin_money', Math.max(0, total - loan));
        }
    }, [tractor_q, tractor_dp, trailer_q, trailer_dp, implement_q, implement_dp,
        sh_animal, sh_shed, sh_feed, sh_ins, sh_misc,
        bu_bullock, bu_cart, bu_loan, schemeType, setValue]);
        
    // RHF's watch() returns the SAME array reference while typing inside rows
    // (only append/remove makes a new array), so effects keyed on the array
    // only fired when a row was added. Key on the serialized contents instead
    // so locked/computed fields update on every keystroke.
    const cropsKey = JSON.stringify(cropsData);
    const landKey = JSON.stringify(landParcels);
    const preDevCropsKey = JSON.stringify(preDevCropsData);
    const postDevCropsKey = JSON.stringify(postDevCropsData);
    const devWorkRatesKey = JSON.stringify(devWorkRates);

    // Auto-calculate crop incomes
    React.useEffect(() => {
        calculateCropIncomes(cropsData);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cropsKey, calculateCropIncomes]);

    // LAND_DEV: pre/post-development crop rows get the FULL chart economics
    // (cost/yield/rate/income columns for the ಕ್ಷೇತ್ರ ಆಯವ್ಯಯ ತಃಖ್ತೆ page),
    // not just the net income.
    React.useEffect(() => {
        calculateCropEconomics(preDevCropsData, 'pre_dev_crops');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preDevCropsKey, calculateCropEconomics]);
    React.useEffect(() => {
        calculateCropEconomics(postDevCropsData, 'post_dev_crops');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postDevCropsKey, calculateCropEconomics]);

    // LAND_DEV: development-work amount = LOCKED bank rate/acre x total extent
    // (same extent formula as land valuation above), recomputed as the land
    // table changes. Rates are the DEV_WORK_RATES constants, never form input.
    React.useEffect(() => {
        if (schemeType !== 'LAND_DEV') return;
        const totalExtentDecimal = (landParcels || []).reduce(
            (sum, row) => sum + (parseFloat(row?.acres) || 0) + (parseFloat(row?.guntas) || 0) / 40,
            0
        );
        DEV_WORK_RATES.forEach((rate, index) => {
            setValue(`dev_work_amounts.${index}`, rate > 0 ? Math.round(rate * totalExtentDecimal) : 0);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [landKey, schemeType, setValue]);

    // Auto-calculate total land area
    React.useEffect(() => {
        calculateLandTotals(landParcels, landValuationRate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [landKey, landValuationRate, calculateLandTotals]);

    // Auto-calculate age from dob
    const dob = watch('dob');
    React.useEffect(() => {
        const dobIso = dmyToIso(dob);
        if (dobIso) {
            const today = new Date();
            const birthDate = new Date(dobIso);
            let computedAge = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                computedAge--;
            }
            setValue('age', computedAge);
        }
    }, [dob, setValue]);

    // Edit mode: load existing data
    React.useEffect(() => {
        if (!id) return;
        const loadData = async () => {
            try {
                const data = await getApplication(id);
                const app = data.application;
                const details = data.details || {};
                setSchemeType(app.scheme_type);

                // Split stored full name back into parts
                const nameParts = (app.applicant_name_kn || '').split(' ');
                const prevLoans = (() => {
                    try { return JSON.parse(app.previous_loans || '{}') || {}; } catch { return {}; }
                })();
                const formData = {
                    ...app,
                    application_date: isoToDmy(app.application_date),
                    dob: isoToDmy(app.dob),
                    loan_duration_years: app.loan_duration_years || 7,
                    // caste: map legacy values to the chart list; unknown -> "other" + free text
                    ...(() => {
                        const stored = (app.caste || '').trim();
                        const mapped = CASTE_LEGACY_MAP[stored] || stored;
                        if (!stored || CASTE_OPTIONS.includes(mapped)) {
                            return { caste: mapped || 'ಇತರೆ ಸಾಮಾನ್ಯ', caste_custom: '' };
                        }
                        return { caste: CASTE_OTHER, caste_custom: stored };
                    })(),
                    prev_purpose: prevLoans.purpose || '',
                    prev_total_loan: prevLoans.total_loan || '',
                    prev_outstanding: prevLoans.outstanding || '',
                    prev_annual_installment: prevLoans.annual_installment || '',
                    prev_repaid_status: prevLoans.repaid_status || '',
                    prev_utility_report_pages: prevLoans.utility_report_pages || '',
                    prev_loan_account_pages: prevLoans.loan_account_pages || '',
                    prev_mortgage_book_pages: prevLoans.mortgage_book_pages || '',
                    name_first:  nameParts[0] || '',
                    name_middle: nameParts.length > 2 ? nameParts[1] : '',
                    name_last:   nameParts.length > 2 ? nameParts[2] : (nameParts[1] || ''),
                    land_parcels: parseJsonArray(app.land_parcels).map((parcel, index) => ({
                        ...parcel,
                        sl: parcel.sl || String(index + 1),
                        village: parcel.village || '',
                        survey_no: parcel.survey_no || '',
                        acres: parcel.acres ?? '',
                        guntas: parcel.guntas ?? '',
                        akaar: parcel.akaar ?? '',
                    })),
                    crops: parseJsonArray(app.current_crop).map((crop) => ({
                        ...crop,
                        crop_name: normalizeCropName(crop.crop_name),
                        acres: crop.acres ?? '',
                        guntas: crop.guntas ?? '',
                        annual_income: crop.annual_income ?? '',
                    })),
                };

                if (app.scheme_type === 'TRACTOR' && details) {
                    formData.tractor_make             = details.tractor_make;
                    formData.tractor_model            = details.tractor_model;
                    formData.tractor_hp               = details.tractor_hp;
                    formData.tractor_dealer          = details.tractor_dealer;
                    formData.tractor_quotation       = details.tractor_quotation ?? details.tractor_cost;
                    formData.tractor_down_payment    = details.tractor_down_payment;
                    formData.tractor_bank_loan       = details.tractor_bank_loan;
                    formData.trailer_make            = details.trailer_make;
                    formData.trailer_capacity        = details.trailer_capacity;
                    formData.trailer_dealer          = details.trailer_dealer;
                    formData.trailer_quotation       = details.trailer_quotation ?? details.trailer_cost;
                    formData.trailer_down_payment    = details.trailer_down_payment;
                    formData.trailer_bank_loan       = details.trailer_bank_loan;
                    formData.implement_dealer        = details.implement_dealer;
                    formData.implement_quotation     = details.implement_quotation ?? details.implement_cost;
                    formData.implement_down_payment  = details.implement_down_payment;
                    formData.implement_bank_loan     = details.implement_bank_loan;
                    formData.total_quotation         = details.total_quotation ?? details.total_project_cost;
                    formData.total_down_payment      = details.total_down_payment;
                    formData.total_loan_amount       = details.total_loan_amount ?? details.loan_amount;
                    formData.loan_amount             = details.total_loan_amount ?? details.loan_amount ?? app.loan_amount;
                } else if (app.scheme_type === 'LAND_DEV' && details) {
                    formData.land_type = details.land_type || LAND_TYPE_OPTIONS[1];
                    formData.pre_dev_crops = parseJsonArray(details.pre_dev_crops).map((crop) => ({
                        ...crop,
                        crop_name: normalizeCropName(crop.crop_name),
                        acres: crop.acres ?? '',
                        guntas: crop.guntas ?? '',
                        annual_income: crop.annual_income ?? '',
                    }));
                    formData.post_dev_crops = parseJsonArray(details.post_dev_crops).map((crop) => ({
                        ...crop,
                        crop_name: normalizeCropName(crop.crop_name),
                        acres: crop.acres ?? '',
                        guntas: crop.guntas ?? '',
                        annual_income: crop.annual_income ?? '',
                    }));
                    const devWorkItems = parseJsonArray(details.dev_work_items);
                    // Rates are locked bank constants — old rows with typed
                    // rates get corrected to the constants on the next save.
                    formData.dev_work_rates = DEV_WORK_RATES;
                    formData.dev_work_amounts = DEV_WORK_DESCRIPTIONS.map(
                        (_, i) => devWorkItems[i]?.amount ?? ''
                    );
                } else if (app.scheme_type.includes('SHEEP') && details) {
                    formData.animal_cost   = details.animal_cost;
                    formData.shed_cost     = details.shed_cost;
                    formData.feed_cost     = details.feed_cost;
                    formData.insurance_amt = details.insurance_amt;
                    formData.misc_cost     = details.misc_cost;
                    formData.sheep_total_cost = details.total_cost;
                } else if (app.scheme_type === 'BULLOCK' && details) {
                    formData.bullock_cost        = details.bullock_cost;
                    formData.cart_cost           = details.cart_cost;
                    formData.bullock_total_cost  = details.total_cost;
                    formData.bullock_loan_amount = details.loan_amount;
                    formData.bullock_margin_money = details.margin_money;
                }
                const irrigationValues = parseIrrigationSourceField(app.irrigation_source);
                formData.irrigation_source = irrigationValues.sources;
                formData.irrigation_hp = irrigationValues.hp;
                reset(formData);
            } catch (err) {
                console.error('Failed to load application', err);
                alert('Failed to load application for editing');
            }
        };
        loadData();
    }, [id, reset]);

    // ── Submit ────────────────────────────────────────────────────────────────
    const onSubmit = async (rawData) => {
        const currentScheme = rawData.scheme_type || schemeType;

        // Combine name parts
        const fullName = [rawData.name_first, rawData.name_middle, rawData.name_last]
            .filter(Boolean).join(' ').trim();
            
        // Map Middle Name to Father/Husband name
        rawData.father_name_kn = rawData.name_middle;

        const sanitize = (obj) => {
            const clean = { ...obj };
            return clean;
        };
        const data = sanitize(rawData);

        const headerFields = [
            'father_name_kn', 'age', 'gender', 'mobile_no', 'aadhaar_no',
            'caste', 'farmer_type', 'occupation', 'dob', 'current_crop',
            'annual_income', 'loan_amount', 'loan_duration_years', 'borrower_type',
            'account_no', 'ifsc_code', 'bank_name', 'branch_name',
            'village', 'hobli', 'taluk', 'district', 'scheme_type',
            'total_area_acres', 'total_guntas', 'land_valuation_per_acre',
            'application_date',
        ];

        const irrigationSources = Array.isArray(data.irrigation_source)
            ? data.irrigation_source
            : typeof data.irrigation_source === 'string'
                ? data.irrigation_source.split(',').map(s => s.trim()).filter(Boolean)
                : [];

        const payload = {
            scheme_type: currentScheme,
            applicant_name_kn: fullName,
            previous_loans: JSON.stringify({
                purpose: data.prev_purpose || '',
                total_loan: data.prev_total_loan || '',
                outstanding: data.prev_outstanding || '',
                annual_installment: data.prev_annual_installment || '',
                repaid_status: data.prev_repaid_status || '',
                utility_report_pages: data.prev_utility_report_pages || '',
                loan_account_pages: data.prev_loan_account_pages || '',
                mortgage_book_pages: data.prev_mortgage_book_pages || '',
            }),
            co_applicants: JSON.stringify(data.co_applicants || []),
            land_parcels: JSON.stringify(data.land_parcels || []),
            // LAND_DEV keeps crops in pre/post-dev tables; the generic list
            // is hidden there, and sending [] clears any stale duplicates on edit.
            current_crop: JSON.stringify(currentScheme === 'LAND_DEV' ? [] : (data.crops || [])),
            irrigation_source: irrigationSources
                .map((source) => {
                    const key = sanitizeIrrigationKey(source);
                    const hp = data.irrigation_hp?.[key];
                    return hp ? `${source} (${hp} HP)` : source;
                })
                .join(', ')
        };

        headerFields.forEach(k => { if (data[k] !== undefined && k !== 'current_crop') payload[k] = data[k]; });

        // "Other" caste: store the typed caste text itself (prints verbatim on the PDF)
        if (payload.caste === CASTE_OTHER) {
            payload.caste = (data.caste_custom || '').trim() || 'ಇತರೆ';
        }

        // Dates typed as DD/MM/YYYY -> ISO for the API (invalid/blank -> null)
        payload.application_date = dmyToIso(data.application_date);
        payload.dob = dmyToIso(data.dob);

        // Scheme-specific details
        if (currentScheme === 'TRACTOR') {
            payload.tractor_details = {
                tractor_make:          data.tractor_make || null,
                tractor_model:         data.tractor_model || null,
                tractor_hp:            data.tractor_hp || null,
                tractor_dealer:        data.tractor_dealer || null,
                tractor_quotation:     data.tractor_quotation ? parseFloat(data.tractor_quotation) : null,
                tractor_down_payment:  data.tractor_down_payment ? parseFloat(data.tractor_down_payment) : null,
                tractor_bank_loan:     data.tractor_bank_loan ? parseFloat(data.tractor_bank_loan) : null,
                
                trailer_make:          data.trailer_make || null,
                trailer_capacity:      data.trailer_capacity || null,
                trailer_dealer:        data.trailer_dealer || null,
                trailer_quotation:     data.trailer_quotation ? parseFloat(data.trailer_quotation) : null,
                trailer_down_payment:  data.trailer_down_payment ? parseFloat(data.trailer_down_payment) : null,
                trailer_bank_loan:     data.trailer_bank_loan ? parseFloat(data.trailer_bank_loan) : null,
                
                implement_dealer:      data.implement_dealer || null,
                implement_quotation:   data.implement_quotation ? parseFloat(data.implement_quotation) : null,
                implement_down_payment:data.implement_down_payment ? parseFloat(data.implement_down_payment) : null,
                implement_bank_loan:   data.implement_bank_loan ? parseFloat(data.implement_bank_loan) : null,
                
                total_quotation:       data.total_quotation ? parseFloat(data.total_quotation) : null,
                total_down_payment:    data.total_down_payment ? parseFloat(data.total_down_payment) : null,
                total_loan_amount:     data.total_loan_amount ? parseFloat(data.total_loan_amount) : null,
            };
        } else if (currentScheme === 'LAND_DEV') {
            const totalExtentDecimal = (data.land_parcels || []).reduce(
                (sum, row) => sum + (parseFloat(row?.acres) || 0) + (parseFloat(row?.guntas) || 0) / 40,
                0
            );
            const devWorkItems = DEV_WORK_DESCRIPTIONS.map((description, i) => {
                const rate = DEV_WORK_RATES[i]; // locked bank rates, never form input
                const amount = rate > 0 ? Math.round(rate * totalExtentDecimal) : 0;
                return { description, rate_per_acre: rate, amount };
            });
            const totalDevCost = devWorkItems.reduce((sum, w) => sum + w.amount, 0);
            payload.land_details = {
                land_type: data.land_type || null,
                pre_dev_crops: JSON.stringify(data.pre_dev_crops || []),
                post_dev_crops: JSON.stringify(data.post_dev_crops || []),
                dev_work_items: JSON.stringify(devWorkItems),
                total_dev_cost: totalDevCost || null,
            };
        } else if (currentScheme.includes('SHEEP')) {
            payload.sheep_details = {
                variant:       currentScheme.replace('SHEEP_', ''),
                animal_cost:   data.animal_cost   ? parseFloat(data.animal_cost)   : null,
                shed_cost:     data.shed_cost     ? parseFloat(data.shed_cost)     : null,
                feed_cost:     data.feed_cost     ? parseFloat(data.feed_cost)     : null,
                insurance_amt: data.insurance_amt ? parseFloat(data.insurance_amt) : null,
                misc_cost:     data.misc_cost     ? parseFloat(data.misc_cost)     : null,
                total_cost:    data.sheep_total_cost ? parseFloat(data.sheep_total_cost) : null,
            };
        } else if (currentScheme === 'BULLOCK') {
            payload.bullock_details = {
                bullock_cost:  data.bullock_cost  ? parseFloat(data.bullock_cost)  : null,
                cart_cost:     data.cart_cost     ? parseFloat(data.cart_cost)     : null,
                total_cost:    data.bullock_total_cost ? parseFloat(data.bullock_total_cost) : null,
                loan_amount:   data.bullock_loan_amount ? parseFloat(data.bullock_loan_amount) : null,
                margin_money:  data.bullock_margin_money ? parseFloat(data.bullock_margin_money) : null,
            };
        }

        try {
            if (id) {
                await updateApplication(id, payload);
                alert('Application Updated Successfully!');
                navigate('/applications');
            } else {
                const created = await api.post('/applications/', payload);
                localStorage.removeItem(draftKey);
                // Straight to the print/download screen for a freshly saved
                // application (save-then-print), instead of the plain list.
                navigate(`/applications/${created.data.id}/print`);
            }
        } catch (err) {
            console.error('Save Error:', err);
            if (err?.response?.status === 401) {
                // Dead login discovered at save time. Stay on this page — the
                // typed values are still in the form (and in the local draft);
                // a fresh login in another tab refreshes the token this tab's
                // requests read from localStorage.
                alert(
                    'ಲಾಗಿನ್ ಅವಧಿ ಮುಗಿದಿದೆ. ಹೊಸ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ಮತ್ತೆ ಲಾಗಿನ್ ಮಾಡಿ, ನಂತರ ಇಲ್ಲಿಗೆ ಬಂದು ಮತ್ತೆ Save ಒತ್ತಿರಿ — ಟೈಪ್ ಮಾಡಿದ ಮಾಹಿತಿ ಕಳೆದುಹೋಗಿಲ್ಲ.\n\n'
                    + 'Your login session expired. Open a NEW tab, log in again, then come back to this tab and press Save — nothing you typed is lost.'
                );
                return;
            }
            const detail = err?.response?.data?.detail;
            let msg = detail;
            if (Array.isArray(detail)) {
                msg = detail.map(d => `${d.loc.join(' > ')}: ${d.msg}`).join('\n');
            } else if (typeof detail === 'object') {
                msg = JSON.stringify(detail);
            }
            alert(`Failed to save application.\n\nErrors:\n${msg || 'Unknown Server Error'}`);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-7xl mx-auto pb-20">

            {/* Header Banner */}
            <div className={`bg-gradient-to-br ${config.gradient} rounded-2xl p-8 mb-8 text-white shadow-card relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl" />
                <div className="relative z-10 flex items-center">
                    <div className="p-4 bg-white/10 rounded-2xl mr-6 backdrop-blur-md border border-white/20">
                        {config.icon}
                    </div>
                    <div>
                        <h2 className="text-4xl font-black tracking-tight text-white mb-2 drop-shadow-md">
                            {t(config.titleKey || 'tractorScheme')}
                        </h2>
                        <p className="text-primary-100 text-lg font-medium opacity-90">
                            {language === 'kn' ? 'ಸಾಲದ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಕೆಳಗಿನ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ' : 'Fill in the details below to submit the loan application'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {language === 'kn' ? 'ಕನ್ನಡದಲ್ಲಿ ನಮೂದಿಸಿ — ಹೆಸರು, ಗ್ರಾಮ, ವಿಳಾಸ ಮತ್ತು ಇತರ ಕನ್ನಡ ಕ್ಷೇತ್ರಗಳಿಗೆ ಕನ್ನಡವನ್ನು ಬಳಸಿ. IFSC, ಖಾತೆ ಸಂಖ್ಯೆ, ಮೊಬೈಲ್ ಮತ್ತು ಆಧಾರ್ ಕ್ಷೇತ್ರಗಳಿಗೆ ಇಂಗ್ಲಿಷ್/ಅಂಕಿ ಅಕ್ಷರಗಳನ್ನು ಹಾಗೆಯೇ ಉಳಿಸಲಾಗುವುದು.' : 'ಕನ್ನಡದಲ್ಲಿ ನಮೂದಿಸಿ — ಹೆಸರು, ಗ್ರಾಮ, ವಿಳಾಸ ಮತ್ತು ಇತರ Kannada ಕ್ಷೇತ್ರಗಳಿಗೆ ಕನ್ನಡವನ್ನು ಬಳಸಿ. IFSC, ಖಾತೆ ಸಂಖ್ಯೆ, ಮೊಬೈಲ್ ಮತ್ತು ಆಧಾರ್ ಕ್ಷೇತ್ರಗಳಿಗೆ ಇಂಗ್ಲಿಷ್/ಆಂಕಿ ಅಕ್ಷರಗಳನ್ನು ಹಾಗೆಯೇ ಉಳಿಸಲಾಗುವುದು.'}
                </div>

                {/* Live summary — sticks while scrolling; values update as the operator types */}
                {(() => {
                    const liveLoan = parseFloat(watch('loan_amount')) || 0;
                    const liveAcres = watch('total_area_acres');
                    const liveGuntas = watch('total_guntas');
                    const liveDuration = watch('loan_duration_years') || 7;
                    const extent = (parseFloat(liveAcres) || 0) > 0
                        ? `${parseInt(liveAcres, 10)}.${String(parseInt(liveGuntas, 10) || 0).padStart(2, '0')}`
                        : null;
                    return (
                        <AnimatePresence>
                            {(liveLoan > 0 || extent) && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                    className="sticky top-3 z-30 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-2xl border border-primary-800 bg-primary-950/95 px-5 py-3 text-sm text-white shadow-lg backdrop-blur"
                                >
                                    <span className="flex items-center gap-2 font-semibold text-accent-300">
                                        <Calculator size={15} /> {L("ನೇರ ಲೆಕ್ಕ — Live")}
                                    </span>
                                    {extent && (
                                        <span>ಒಟ್ಟು ಹಿಡುವಳಿ&nbsp;<b>{extent}</b>&nbsp;<span className="text-primary-300">ಎಕರೆ</span></span>
                                    )}
                                    {liveLoan > 0 && (
                                        <span>ಸಾಲ&nbsp;<b>₹{liveLoan.toLocaleString('en-IN')}</b></span>
                                    )}
                                    {liveLoan > 0 && (
                                        // Yearly installment — matches the packet (bank review 2026-08-04:
                                        // installments are annual, not half-yearly)
                                        <span className="text-primary-200">ಅವಧಿ {liveDuration} ವರ್ಷ · ಕಂತು ≈ ₹{Math.round(liveLoan / liveDuration).toLocaleString('en-IN')} × {liveDuration} (ವಾರ್ಷಿಕ)</span>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    );
                })()}

                {/* ── 1. APPLICANT DETAILS ── */}
                <div className="bg-white p-8 rounded-2xl shadow-card border border-stone-200/70">
                    <SectionHeader title="ಅರ್ಜಿದಾರ ವಿವರ — Applicant Details" color="blue" />

                    <div className="mb-6 max-w-xs">
                        <div className="group">
                            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                                {L("ಅರ್ಜಿ ದಿನಾಂಕ — Application Date")}
                            </label>
                            <Controller name="application_date" control={control}
                                render={({ field }) => (
                                    <DatePicker value={field.value || ''} onChange={field.onChange} />
                                )} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            {L("ಖಾಲಿ ಬಿಟ್ಟರೆ ಇಂದಿನ ದಿನಾಂಕ — leave blank to use today's date on the printed form")}
                        </p>
                    </div>

                    {/* Name split into 3 */}
                    <div className="mb-6">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            {L("ಅರ್ಜಿದಾರ ಹೆಸರು — Full Name *")}
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            <InputField label="ಮೊದಲ ಹೆಸರು — First Name"
                                register={register('name_first', { required: true })}
                                placeholder="ರಮೇಶ" />
                            <InputField label="ಮಧ್ಯದ ಹೆಸರು (ತಂದೆ/ಗಂಡನ ಹೆಸರು) — Middle Name"
                                register={register('name_middle')}
                                placeholder="ಕುಮಾರ" />
                            <InputField label="ಅಡ್ಡಹೆಸರು — Last Name / Surname"
                                register={register('name_last', { required: true })}
                                placeholder="ಪಾಟೀಲ" />
                        </div>
                        {(errors.name_first || errors.name_last) && (
                            <p className="text-red-500 text-xs mt-1">First name and last name are required</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                        <div className="grid grid-cols-3 gap-3 md:col-span-2">
                            <div className="group">
                                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                                    {L("ಜನಿಸಿದ ದಿನಾಂಕ — DOB")}
                                </label>
                                <Controller name="dob" control={control}
                                    render={({ field }) => (
                                        <DatePicker value={field.value || ''} onChange={field.onChange} />
                                    )} />
                            </div>
                            <InputField label="ವಯಸ್ಸು — Age *" type="number"
                                register={register('age', { required: true })} />
                            <SelectField label="ಲಿಂಗ — Gender"
                                register={register('gender')}
                                options={['Male / ಪುರುಷ', 'Female / ಮಹಿಳೆ', 'Other']} />
                        </div>

                        <InputField label="ಮೊಬೈಲ್ ಸಂಖ್ಯೆ — Mobile *"
                            register={register('mobile_no', { required: true })}
                            placeholder="10 digit number"
                            inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '[0-9]{10}', onInput: (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); } }} />
                        <InputField label="ಆಧಾರ್ ಸಂಖ್ಯೆ — Aadhaar *"
                            register={register('aadhaar_no', { required: true })}
                            placeholder="12 digit number"
                            inputProps={{ maxLength: 12, inputMode: 'numeric', pattern: '[0-9]{12}', onInput: (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 12); } }} />

                        <div className="grid grid-cols-1 gap-3">
                            <SelectField label="ಜಾತಿ — Caste"
                                register={register('caste')}
                                options={[...CASTE_OPTIONS, { value: CASTE_OTHER, label: 'ಇತರೆ — ಪಟ್ಟಿಯಲ್ಲಿ ಇಲ್ಲ (ಕೆಳಗೆ ನಮೂದಿಸಿ)' }]} />
                            {watch('caste') === CASTE_OTHER && (
                                <InputField label="ಬೇರೆ ಜಾತಿ ನಮೂದಿಸಿ — Enter caste"
                                    register={register('caste_custom')}
                                    placeholder="ಜಾತಿ (ಕನ್ನಡದಲ್ಲಿ)" />
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <SelectField label="ರೈತ ವರ್ಗ — Farmer Type"
                                register={register('farmer_type')}
                                options={FARMER_OPTIONS} />
                            <SelectField label="ಸಾಲಗಾರ ವಿಧ — Borrower Type"
                                register={register('borrower_type')}
                                options={['New / ಹೊಸ', 'Old / ಹಿಂದಿನ']} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {L("ಸಾಲದ ಅವಧಿ — Loan Duration (Years)")}
                            </label>
                            <select
                                {...register('loan_duration_years')}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white"
                            >
                                {Array.from({ length: 15 }, (_, i) => i + 1).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                                {L("ಮರುಪಾವತಿ ಅವಧಿ — repayment period printed on the packet (default 7)")}
                            </p>
                        </div>

                        {/* Previous-loan details: only for old borrowers; prints on PDF page 9 section 9) */}
                        {isOldBorrower && (
                            <div className="md:col-span-2 mt-2 p-4 border border-accent-200 bg-accent-50/60 rounded-xl">
                                <p className="text-xs font-bold text-accent-700 uppercase tracking-wider mb-3">
                                    {L("ಹಿಂದಿನ ಸಾಲದ ವಿವರ — Previous Loan Details (ಹಳೇ ಸಾಲಗಾರರಿಗೆ)")}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    <div className="md:col-span-2">
                                        <InputField label="ಯೋಜನೆ / ಉದ್ದೇಶ — Previous Loan Purpose"
                                            register={register('prev_purpose')} placeholder="ಉದಾ: ಪಂಪಸೆಟ್ ಸಾಲ" />
                                    </div>
                                    <InputField label="1) ಪಡೆದಿರುವ ಒಟ್ಟು ಸಾಲದ ಮೊತ್ತ (ರೂ.)" type="number"
                                        register={register('prev_total_loan')} />
                                    <InputField label="2) ಹಾಲಿ ಇರುವ ಸಾಲ ಹೊರೆ ಬಾಕಿ ಮೊತ್ತ (ರೂ.)" type="number"
                                        register={register('prev_outstanding')} />
                                    <InputField label="3) ಒಟ್ಟು ವಾರ್ಷಿಕ ಕಂತಿನ ಮೊತ್ತ (ರೂ.)" type="number"
                                        register={register('prev_annual_installment')} />
                                    <InputField label="4) ಚಾಲ್ತಿಯವರೆಗೆ ಮರುಪಾವತಿ ಮಾಡಲಾಗಿದೆಯೇ ?"
                                        register={register('prev_repaid_status')} placeholder="ಹೌದು / ಇಲ್ಲ" />
                                    <InputField label="5) ಎಲ್ಲಾ ಸಾಲಗಳ ಉಪಯುಕ್ತತೆ ವರದಿ ಲಗತ್ತಿಸಿದ ಹಾಳೆ ಸಂಖ್ಯೆ"
                                        register={register('prev_utility_report_pages')} />
                                    <InputField label="6) ಸಾಲಗಳ ಖಾತೆ ನಕಲುಗಳನ್ನು ಲಗತ್ತಿಸಿರಿ — ಹಾಳೆ ಸಂಖ್ಯೆ"
                                        register={register('prev_loan_account_pages')} />
                                    <InputField label="7) ಆಸ್ತಿ ಅಡಮಾನ ಪುಸ್ತಕದ ನಕಲು ಲಗತ್ತಿಸಿರಿ — ಹಾಳೆ ಸಂಖ್ಯೆ"
                                        register={register('prev_mortgage_book_pages')} />
                                </div>
                            </div>
                        )}

                        {/* Dynamic Co-Applicants */}
                        <div className="md:col-span-2 mt-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    {L("ಸಹ ಅರ್ಜಿದಾರರು — Co-Applicants (Optional)")}
                                </p>
                                <Button type="button" variant="secondary" size="sm"
                                    onClick={() => coAppAppend({ name: '', relation: '' })}>
                                    <Plus size={14} /> {L("ಸೇರಿಸಿ (Add)")}
                                </Button>
                            </div>
                            
                            <div className="space-y-3">
                                {coAppFields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-stone-50 p-3 rounded-xl border border-stone-200/70">
                                        <div className="col-span-6">
                                            <InputField label={`ಸಹ ಅರ್ಜಿದಾರ ${index + 1} — Name`}
                                                register={register(`co_applicants.${index}.name`)}
                                                placeholder="Full name" />
                                        </div>
                                        <div className="col-span-5">
                                            <SelectField label="ಸಂಬಂಧ — Relation"
                                                register={register(`co_applicants.${index}.relation`)}
                                                options={RELATION_OPTIONS} />
                                        </div>
                                        <div className="col-span-1 pb-2">
                                            <button type="button" onClick={() => coAppRemove(index)}
                                                className="w-full h-10 flex items-center justify-center text-red-400 hover:text-red-600 bg-white border border-red-100 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {coAppFields.length === 0 && (
                                    <p className="text-sm text-gray-400 italic">{language === 'kn' ? 'ಸಹ ಅರ್ಜಿದಾರರನ್ನು ಸೇರಿಸಿಲ್ಲ.' : 'No co-applicants added.'}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 2. ADDRESS ── */}
                <div className="bg-white p-8 rounded-2xl shadow-card border border-stone-200/70">
                    <SectionHeader title="ವಾಸಸ್ಥಳ ವಿಳಾಸ — Residential Address" color="green" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        <InputField label="ಗ್ರಾಮ — Village *" register={register('village', { required: true })} inputProps={{ lang: 'kn' }} />
                        <InputField label="ಹೋಬಳಿ — Hobli *" register={register('hobli', { required: true })} inputProps={{ lang: 'kn' }} />
                        <InputField label="ತಾಲೂಕ — Taluk *" register={register('taluk', { required: true })} inputProps={{ lang: 'kn' }} />
                        <InputField label="ಜಿಲ್ಲೆ — District *" register={register('district', { required: true })} inputProps={{ lang: 'kn' }} />
                    </div>
                </div>

                {/* ── 3. LAND DETAILS ── */}
                <div className="bg-white p-8 rounded-2xl shadow-card border border-stone-200/70">
                    <SectionHeader title="ಭೂ ವಿವರ — Land Details" icon={<Sprout size={18} />} color="green" />

                    {schemeType === 'TRACTOR' && (
                        <div className="mb-4 max-w-sm">
                            <label className="block text-xs font-bold text-green-800 mb-1">
                                {L("ಜಮೀನಿನ ಮೌಲ್ಯ (ಪ್ರತಿ ಎಕರೆಗೆ) — Land Valuation per Acre (₹)")}
                            </label>
                            <input
                                type="number" step="1" min="0"
                                onWheel={(e) => e.target.blur()}
                                {...register('land_valuation_per_acre')}
                                placeholder="ಉದಾ: 500000"
                                className="w-full px-3 py-2 text-sm border border-green-200 rounded-lg outline-none focus:border-green-400 focus:bg-green-50"
                            />
                        </div>
                    )}

                    {/* Land Table */}
                    <div className="overflow-x-auto mb-4">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-green-50">
                                    <th className="border border-green-200 px-3 py-2 text-left text-xs font-bold text-green-800 w-10">ಸ.ನಂ</th>
                                    <th className="border border-green-200 px-3 py-2 text-left text-xs font-bold text-green-800">{L("ಗ್ರಾಮ — Village")}</th>
                                    <th className="border border-green-200 px-3 py-2 text-left text-xs font-bold text-green-800">{L("ಸರ್ವೆ ನಂ — Survey No")}</th>
                                    <th className="border border-green-200 px-3 py-2 text-left text-xs font-bold text-green-800">{L("ಎಕರೆ — Acres")}</th>
                                    <th className="border border-green-200 px-3 py-2 text-left text-xs font-bold text-green-800">{L("ಗುಂಟೆ — Guntas")}</th>
                                    <th className="border border-green-200 px-3 py-2 text-left text-xs font-bold text-green-800">{L("ಆಕಾರ — Akaar")}</th>
                                    {schemeType === 'TRACTOR' && (
                                        <th className="border border-green-200 px-3 py-2 text-left text-xs font-bold text-green-800">{L("ಜಮೀನಿನ ಮೌಲ್ಯ — Land Value")}</th>
                                    )}
                                    <th className="border border-green-200 px-2 py-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {landFields.map((field, index) => (
                                    <tr key={field.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="border border-gray-200 px-2 py-1 text-center text-gray-500 font-medium">
                                            {index + 1}
                                        </td>
                                        <td className="border border-gray-200 px-1 py-1">
                                            <input
                                                {...register(`land_parcels.${index}.village`)}
                                                placeholder="ಗ್ರಾಮ"
                                                className="w-full px-2 py-1.5 text-sm outline-none bg-transparent focus:bg-primary-50 rounded"
                                            />
                                        </td>
                                        <td className="border border-gray-200 px-1 py-1">
                                            <input
                                                {...register(`land_parcels.${index}.survey_no`)}
                                                placeholder="123/A"
                                                className="w-full px-2 py-1.5 text-sm outline-none bg-transparent focus:bg-primary-50 rounded"
                                            />
                                        </td>
                                        <td className="border border-gray-200 px-1 py-1">
                                            <input
                                                type="number" step="0.01" min="0"
                                                onWheel={(e) => e.target.blur()}
                                                {...register(`land_parcels.${index}.acres`)}
                                                placeholder="0"
                                                className="w-full px-2 py-1.5 text-sm outline-none bg-transparent focus:bg-primary-50 rounded"
                                            />
                                        </td>
                                        <td className="border border-gray-200 px-1 py-1">
                                            <input
                                                type="number"
                                                step="any" min="0"
                                                onWheel={(e) => e.target.blur()}
                                                {...register(`land_parcels.${index}.guntas`)}
                                                placeholder="0"
                                                className="w-full px-2 py-1.5 text-sm outline-none bg-transparent focus:bg-primary-50 rounded"
                                            />
                                        </td>
                                        <td className="border border-gray-200 px-1 py-1">
                                            <input
                                                type="number"
                                                step="any" min="0"
                                                onWheel={(e) => e.target.blur()}
                                                {...register(`land_parcels.${index}.akaar`)}
                                                placeholder="0.00"
                                                className="w-full px-2 py-1.5 text-sm outline-none bg-transparent focus:bg-primary-50 rounded"
                                            />
                                        </td>
                                        {schemeType === 'TRACTOR' && (
                                            <td className="border border-gray-200 px-1 py-1 bg-gray-50">
                                                <input
                                                    readOnly tabIndex={-1}
                                                    {...register(`land_parcels.${index}.valuation`)}
                                                    className="w-full px-2 py-1.5 text-sm outline-none bg-transparent text-gray-700 font-semibold cursor-not-allowed"
                                                />
                                            </td>
                                        )}
                                        <td className="border border-gray-200 px-2 py-1 text-center">
                                            {landFields.length > 1 && (
                                                <button type="button" onClick={() => landRemove(index)}
                                                    className="text-red-400 hover:text-red-600 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {/* Totals row */}
                            <tfoot>
                                <tr className="bg-green-100 font-bold">
                                    <td className="border border-green-300 px-2 py-2 text-center text-xs text-green-800" colSpan={3}>
                                        {L("ಒಟ್ಟು — Total")}
                                    </td>
                                    <td className="border border-green-300 px-2 py-2 text-center text-xs text-green-900">
                                        <input readOnly {...register('total_area_acres')}
                                            className="w-full text-center bg-transparent font-bold text-green-900 outline-none text-xs" />
                                    </td>
                                    <td className="border border-green-300 px-2 py-2 text-center text-xs text-green-900">
                                        <input readOnly {...register('total_guntas')}
                                            className="w-full text-center bg-transparent font-bold text-green-900 outline-none text-xs" />
                                    </td>
                                    <td className="border border-green-300 px-2 py-2 text-center text-xs text-green-900">
                                        <input readOnly {...register('total_akaar')}
                                            className="w-full text-center bg-transparent font-bold text-green-900 outline-none text-xs" />
                                    </td>
                                    {schemeType === 'TRACTOR' && (
                                        <td className="border border-green-300 px-2 py-2 text-center text-xs text-green-900">
                                            <input readOnly tabIndex={-1} {...register('total_land_valuation')}
                                                className="w-full text-center bg-transparent font-bold text-green-900 outline-none text-xs" />
                                        </td>
                                    )}
                                    <td className="border border-green-300 px-2 py-2"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <Button type="button" variant="secondary" size="sm"
                        onClick={() => landAppend({ sl: String(landFields.length + 1), village: '', survey_no: '', acres: '', guntas: '', akaar: '' })}>
                        <Plus size={16} /> {L("ಸಾಲು ಸೇರಿಸಿ — Add Row")}
                    </Button>
                </div>

                {/* ── 4. AGRICULTURE DETAILS ── */}
                <div className="bg-white p-8 rounded-2xl shadow-card border border-stone-200/70">
                    <SectionHeader title="ಕೃಷಿ ವಿವರ — Agriculture Details" icon={<Sprout size={18} />} color="orange" />
                    
                    {/* LAND_DEV collects crops in the pre/post-development
                        tables below — this generic list would be a duplicate,
                        so only irrigation sources show for that scheme. */}
                    {schemeType !== 'LAND_DEV' && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {L("ಬೆಳೆ ವಿವರ — Crop Details (ವಾರ್ಷಿಕ ಬೆಳೆ)")}
                            </label>
                            <Button type="button" variant="secondary" size="sm"
                                onClick={() => cropsAppend({ crop_name: '', acres: '', guntas: '', annual_income: '' })}>
                                <Plus size={14} /> {L("ಬೆಳೆ ಸೇರಿಸಿ (Add Crop)")}
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {cropsFields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-stone-50 p-3 rounded-xl border border-stone-200/70">
                                    <div className="col-span-4">
                                        <SelectField label={`ಬೆಳೆ ${index + 1} — Crop Name`}
                                            register={register(`crops.${index}.crop_name`)}
                                            options={CROP_OPTIONS} />
                                    </div>
                                    <div className="col-span-2">
                                        <InputField label="ಎಕರೆ — Acres"
                                            type="number" step="0.01"
                                            register={register(`crops.${index}.acres`)}
                                            placeholder="0" />
                                    </div>
                                    <div className="col-span-2">
                                        <InputField label="ಗುಂಟೆ — Guntas"
                                            type="number"
                                            register={register(`crops.${index}.guntas`)}
                                            placeholder="0" />
                                    </div>
                                    <div className="col-span-3">
                                        <InputField label="ಆದಾಯ — Income (₹)"
                                            type="number"
                                            register={register(`crops.${index}.annual_income`)}
                                            readOnly />
                                    </div>
                                    <div className="col-span-1 pb-2">
                                        <button type="button" onClick={() => cropsRemove(index)}
                                            className="w-full h-10 flex items-center justify-center text-red-400 hover:text-red-600 bg-white border border-red-100 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {cropsFields.length === 0 && (
                                <p className="text-sm text-gray-400 italic">No crops added.</p>
                            )}
                        </div>
                    </div>
                    )}

                    {/* Irrigation Checkboxes */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            {L("ನೀರಾವರಿ ಮೂಲ — Irrigation Source (Select Multiple)")}
                        </label>
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                            {L("ಸೂಚನೆ: ಅಗತ್ಯವಿರುವ ನೀರಾವರಿ ಮೂಲಗಳಿಗೆ ಮಾತ್ರ HP ನಮೂದಿಸಿ — Enter HP only for the resources that require it")}
                            {language === 'kn'
                                ? ' (ಉದಾ: ಕೊಳವೆ ಬಾವಿ/ಪಂಪಸೆಟ್). ಮೋಟಾರ್ ಇಲ್ಲದ ಮೂಲಗಳಿಗೆ ಖಾಲಿ ಬಿಡಬಹುದು.'
                                : ' (e.g. borewell/pumpset). Sources without a motor can be left blank.'}
                        </p>
                        <div className="grid gap-3 mb-3">
                            {IRRIGATION_OPTIONS.map((opt) => {
                                const key = sanitizeIrrigationKey(opt);
                                const selected = Array.isArray(irrigationSource) && irrigationSource.includes(opt);
                                return (
                                    <label key={opt} className="flex flex-wrap items-center gap-3 px-3 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
                                        <span className="flex items-center gap-2">
                                            <input type="checkbox" value={opt} {...register('irrigation_source')} className="w-4 h-4 text-primary-700 rounded" />
                                            <span>{language === 'kn' ? knOption(opt) : opt}</span>
                                        </span>
                                        {selected && (
                                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                                <span className="text-xs text-gray-500">HP</span>
                                                <select
                                                    {...register(`irrigation_hp.${key}`)}
                                                    className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white"
                                                >
                                                    <option value=""></option>
                                                    {Array.from({ length: 39 }, (_, i) => 1 + i * 0.5).map((hp) => (
                                                        <option key={hp} value={hp}>{hp}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── 5. BANK DETAILS ── */}
                <div className="bg-white p-8 rounded-2xl shadow-card border border-stone-200/70">
                    <SectionHeader title="ಬ್ಯಾಂಕ್ ವಿವರ — Bank Details" color="blue" />
                    
                    {/* Removed Requested Loan Amount */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField label="ಖಾತೆ ಸಂಖ್ಯೆ — Account No *"
                            register={register('account_no', { required: true })}
                            placeholder="Account Number"
                            inputProps={{ inputMode: 'text', maxLength: 24, onInput: (e) => { e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 24); } }} />
                        <InputField label="IFSC Code *"
                            register={register('ifsc_code', { required: true })}
                            placeholder="e.g. SBIN0001234"
                            inputProps={{ maxLength: 11, autoCapitalize: 'characters', style: { textTransform: 'uppercase' }, onInput: (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11); } }} />
                        <InputField label="ಬ್ಯಾಂಕ್ ಹೆಸರು — Bank Name *"
                            register={register('bank_name', { required: true })} />
                        <InputField label="ಶಾಖೆ — Branch *"
                            register={register('branch_name', { required: true })} />
                    </div>
                </div>

                {/* ── 6. SCHEME-SPECIFIC SECTIONS ── */}

                {/* TRACTOR */}
                {schemeType === 'TRACTOR' && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100">
                        <SectionHeader title="ಟ್ರ್ಯಾಕ್ಟರ್ ವಿವರ — Tractor & Loan Details" icon={<Car size={18} />} color="blue" />

                        {/* 1. Tractor Details */}
                        <div className="mb-6 bg-gray-50 p-5 rounded-xl border border-gray-200">
                            <p className="text-sm font-bold text-primary-800 uppercase tracking-wider mb-4 border-b border-stone-200 pb-2">{L("1. ಟ್ರ್ಯಾಕ್ಟರ್ — Tractor Details")}</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <InputField label="ಕಂಪನಿ — Make" register={register('tractor_make')} placeholder="e.g. John Deere" />
                                <InputField label="ಮಾಡೆಲ್ — Model" register={register('tractor_model')} placeholder="e.g. 5310" />
                                <InputField label="ಅಶ್ವಶಕ್ತಿ — HP" register={register('tractor_hp')} placeholder="e.g. 50 HP" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-stone-200/70">
                                <InputField label="ಡೀಲರ್ — Dealer Name" register={register('tractor_dealer')} placeholder="Dealer name" />
                                <InputField label="ಕೋಟೇಶನ್ — Quotation (₹)" type="number" register={register('tractor_quotation')} placeholder="₹" />
                                <InputField label="ಮುಂಗಡ ಪಾವತಿ — Down Payment (₹)" type="number" register={register('tractor_down_payment')} placeholder="₹" />
                                <InputField label="ಸಾಲ — Loan (Auto ₹)" type="number" register={register('tractor_bank_loan')} readOnly />
                            </div>
                        </div>

                        {/* 2. Trailer Details */}
                        <div className="mb-6 bg-gray-50 p-5 rounded-xl border border-gray-200">
                            <p className="text-sm font-bold text-primary-800 uppercase tracking-wider mb-4 border-b border-stone-200 pb-2">{L("2. ಟ್ರೇಲರ್ — Trailer Details")}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <InputField label="ಕಂಪನಿ — Make" register={register('trailer_make')} placeholder="e.g. Meharin" />
                                <InputField label="ಸಾಮರ್ಥ್ಯ — Capacity" register={register('trailer_capacity')} placeholder="e.g. 3 Ton" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-stone-200/70">
                                <InputField label="ಡೀಲರ್ — Dealer Name" register={register('trailer_dealer')} placeholder="Dealer name" />
                                <InputField label="ಕೋಟೇಶನ್ — Quotation (₹)" type="number" register={register('trailer_quotation')} placeholder="₹" />
                                <InputField label="ಮುಂಗಡ ಪಾವತಿ — Down Payment (₹)" type="number" register={register('trailer_down_payment')} placeholder="₹" />
                                <InputField label="ಸಾಲ — Loan (Auto ₹)" type="number" register={register('trailer_bank_loan')} readOnly />
                            </div>
                        </div>

                        {/* 3. Implement Details */}
                        <div className="mb-6 bg-gray-50 p-5 rounded-xl border border-gray-200">
                            <p className="text-sm font-bold text-primary-800 uppercase tracking-wider mb-4 border-b border-stone-200 pb-2">{L("3. ಉಪಕರಣಗಳು — Implements Details")}</p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-stone-200/70">
                                <InputField label="ಮೇಕರ್ಸ್/ಡೀಲರ್ — Makers/Dealer" register={register('implement_dealer')} placeholder="Makers or Dealer" />
                                <InputField label="ಕೋಟೇಶನ್ — Quotation (₹)" type="number" register={register('implement_quotation')} placeholder="₹" />
                                <InputField label="ಮುಂಗಡ ಪಾವತಿ — Down Payment (₹)" type="number" register={register('implement_down_payment')} placeholder="₹" />
                                <InputField label="ಸಾಲ — Loan (Auto ₹)" type="number" register={register('implement_bank_loan')} readOnly />
                            </div>
                        </div>

                        {/* Grand Totals */}
                        <div className="bg-primary-900 border border-primary-800 rounded-2xl p-6 shadow-card">
                            <div className="flex items-center gap-2 mb-4">
                                <Calculator size={20} className="text-accent-300" />
                                <span className="font-bold text-lg text-white">{L("ಒಟ್ಟು — Grand Totals")}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <InputField label="ಒಟ್ಟು ಕೋಟೇಶನ್ — Total Quotation (₹)" type="number" register={register('total_quotation')} readOnly variant="dark" />
                                <InputField label="ಒಟ್ಟು ಮುಂಗಡ ಪಾವತಿ — Total Down Payment (₹)" type="number" register={register('total_down_payment')} readOnly variant="dark" />
                                <InputField label="ಒಟ್ಟು ಸಾಲದ ಮೊತ್ತ — Total Loan Amount (₹)" type="number" register={register('total_loan_amount')} readOnly variant="highlight" />
                            </div>
                        </div>
                    </div>
                )}

                {/* LAND_DEV */}
                {schemeType === 'LAND_DEV' && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100">
                        <SectionHeader title="ಭೂ ಅಭಿವೃದ್ಧಿ ವಿವರ — Land Development Details" icon={<Sprout size={18} />} color="green" />

                        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SelectField label="ಜಮೀನಿನ ವಿಧ — Land Type"
                                register={register('land_type')}
                                options={LAND_TYPE_OPTIONS} />
                        </div>

                        {/* Pre-development crops */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {L("ಅಭಿವೃದ್ಧಿ ಪೂರ್ವ ಬೆಳೆಗಳು — Pre-Development Crops")}
                                </label>
                                <Button type="button" variant="secondary" size="sm"
                                    onClick={() => preDevCropsAppend({ crop_name: '', season: '', irrigated: '', acres: '', guntas: '', annual_income: '' })}>
                                    <Plus size={14} /> {L("ಬೆಳೆ ಸೇರಿಸಿ (Add Crop)")}
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {preDevCropsFields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-stone-50 p-3 rounded-xl border border-stone-200/70">
                                        <div className="col-span-3">
                                            <SelectField label={`ಬೆಳೆ ${index + 1} — Crop Name`}
                                                register={register(`pre_dev_crops.${index}.crop_name`)}
                                                options={CROP_OPTIONS} />
                                        </div>
                                        <div className="col-span-2">
                                            <InputField label="ಋತು — Season"
                                                register={register(`pre_dev_crops.${index}.season`)}
                                                placeholder="ಮುಂ/ಹಿಂ" />
                                        </div>
                                        <div className="col-span-2">
                                            <InputField label="ಎಕರೆ — Acres"
                                                type="number" step="0.01"
                                                register={register(`pre_dev_crops.${index}.acres`)}
                                                placeholder="0" />
                                        </div>
                                        <div className="col-span-2">
                                            <InputField label="ಗುಂಟೆ — Guntas"
                                                type="number"
                                                register={register(`pre_dev_crops.${index}.guntas`)}
                                                placeholder="0" />
                                        </div>
                                        <div className="col-span-2">
                                            <InputField label="ಆದಾಯ — Income (₹)"
                                                type="number"
                                                register={register(`pre_dev_crops.${index}.annual_income`)}
                                                readOnly />
                                        </div>
                                        <div className="col-span-1 pb-2">
                                            <button type="button" onClick={() => preDevCropsRemove(index)}
                                                className="w-full h-10 flex items-center justify-center text-red-400 hover:text-red-600 bg-white border border-red-100 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Post-development crops */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {L("ಅಭಿವೃದ್ಧಿ ನಂತರದ ಬೆಳೆಗಳು — Post-Development Crops")}
                                </label>
                                <Button type="button" variant="secondary" size="sm"
                                    onClick={() => postDevCropsAppend({ crop_name: '', season: '', irrigated: '', acres: '', guntas: '', annual_income: '' })}>
                                    <Plus size={14} /> {L("ಬೆಳೆ ಸೇರಿಸಿ (Add Crop)")}
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {postDevCropsFields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-stone-50 p-3 rounded-xl border border-stone-200/70">
                                        <div className="col-span-3">
                                            <SelectField label={`ಬೆಳೆ ${index + 1} — Crop Name`}
                                                register={register(`post_dev_crops.${index}.crop_name`)}
                                                options={CROP_OPTIONS} />
                                        </div>
                                        <div className="col-span-2">
                                            <InputField label="ಋತು — Season"
                                                register={register(`post_dev_crops.${index}.season`)}
                                                placeholder="ವಾ" />
                                        </div>
                                        <div className="col-span-2">
                                            <InputField label="ಎಕರೆ — Acres"
                                                type="number" step="0.01"
                                                register={register(`post_dev_crops.${index}.acres`)}
                                                placeholder="0" />
                                        </div>
                                        <div className="col-span-2">
                                            <InputField label="ಗುಂಟೆ — Guntas"
                                                type="number"
                                                register={register(`post_dev_crops.${index}.guntas`)}
                                                placeholder="0" />
                                        </div>
                                        <div className="col-span-2">
                                            <InputField label="ಆದಾಯ — Income (₹)"
                                                type="number"
                                                register={register(`post_dev_crops.${index}.annual_income`)}
                                                readOnly />
                                        </div>
                                        <div className="col-span-1 pb-2">
                                            <button type="button" onClick={() => postDevCropsRemove(index)}
                                                className="w-full h-10 flex items-center justify-center text-red-400 hover:text-red-600 bg-white border border-red-100 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Development-work cost table: 6 fixed works with
                            LOCKED bank rates (owner 2026-08-06); amount =
                            rate x total extent, all read-only. */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                {L("ಭೂ ಅಭಿವೃದ್ಧಿ ಕಾರ್ಯಗಳ ವೆಚ್ಚ — Development Work Cost")}
                            </label>
                            <div className="rounded-xl border border-stone-200/70 overflow-hidden">
                                <div className="grid grid-cols-12 gap-2 bg-stone-100 px-3 py-1.5 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                                    <div className="col-span-8">{L("ಕಾರ್ಯ — Work")}</div>
                                    <div className="col-span-2 text-right">{L("ದರ/ಎಕರೆ — Rate (₹)")}</div>
                                    <div className="col-span-2 text-right">{L("ಮೊತ್ತ — Amount (₹)")}</div>
                                </div>
                                {DEV_WORK_DESCRIPTIONS.map((description, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-center px-3 py-1.5 text-xs border-t border-stone-100 bg-white">
                                        <div className="col-span-8 text-stone-600">{index + 1}. {description}</div>
                                        <div className="col-span-2 text-right font-medium text-stone-500">
                                            {DEV_WORK_RATES[index].toLocaleString('en-IN')}
                                            <span className="ml-1 text-stone-300" title={L("ಬ್ಯಾಂಕ್ ನಿಗದಿತ ದರ — bank-fixed rate")}>🔒</span>
                                        </div>
                                        <div className="col-span-2 text-right font-semibold text-stone-700">
                                            {(parseFloat(watch(`dev_work_amounts.${index}`)) || 0).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                ))}
                                <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-xs border-t border-stone-200 bg-stone-50 font-bold text-stone-700">
                                    <div className="col-span-10 text-right">{L("ಒಟ್ಟು — Total")}</div>
                                    <div className="col-span-2 text-right">
                                        {DEV_WORK_DESCRIPTIONS
                                            .reduce((sum, _, i) => sum + (parseFloat(watch(`dev_work_amounts.${i}`)) || 0), 0)
                                            .toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SHEEP */}
                {schemeType.includes('SHEEP') && (
                    <div className="bg-white p-8 rounded-2xl shadow-card border border-stone-200/70">
                        <SectionHeader title="ಯೋಜನೆ ವೆಚ್ಚ — Project Cost Breakdown" icon={<Clipboard size={18} />} color="indigo" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <InputField label="ಪ್ರಾಣಿ ವೆಚ್ಚ — Animal Cost" type="number" register={register('animal_cost')} />
                            <InputField label="ಕೊಟ್ಟಿಗೆ — Shed Cost" type="number" register={register('shed_cost')} />
                            <InputField label="ಮೇವು — Feed Cost" type="number" register={register('feed_cost')} />
                            <InputField label="ವಿಮೆ — Insurance" type="number" register={register('insurance_amt')} />
                            <InputField label="ಇತರೆ — Miscellaneous" type="number" register={register('misc_cost')} />
                            <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
                                <InputField label="ಒಟ್ಟು ವೆಚ್ಚ — Total (Auto ₹)" register={register('sheep_total_cost')} readOnly />
                            </div>
                        </div>
                    </div>
                )}

                {/* BULLOCK */}
                {schemeType === 'BULLOCK' && (
                    <div className="bg-white p-8 rounded-2xl shadow-card border border-stone-200/70">
                        <SectionHeader title="ಎತ್ತು ಬಂಡಿ ವಿವರ — Bullock Cart Details" icon={<FileText size={18} />} color="orange" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InputField label="ಎತ್ತುಗಳ ಬೆಲೆ — Bullock Pair Cost (₹)" type="number" register={register('bullock_cost')} />
                            <InputField label="ಬಂಡಿ ಬೆಲೆ — Cart Cost (₹)" type="number" register={register('cart_cost')} />
                            <InputField label="ಬ್ಯಾಂಕ್ ಸಾಲ — Loan Amount (₹)" type="number" register={register('bullock_loan_amount')} placeholder="Enter loan amount" />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-accent-50 p-3 rounded-xl border border-accent-100">
                                    <InputField label="ಒಟ್ಟು ವೆಚ್ಚ — Total (Auto ₹)" register={register('bullock_total_cost')} readOnly />
                                </div>
                                <div className="bg-accent-50 p-3 rounded-xl border border-accent-100">
                                    <InputField label="ಮಾರ್ಜಿನ್ — Margin (Auto ₹)" register={register('bullock_margin_money')} readOnly />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Overall Loan Amount ── */}
                <div className="bg-primary-950 p-6 rounded-2xl border border-primary-900 shadow-card">
                    <div className="flex items-center gap-3 mb-4">
                        <Calculator size={20} className="text-accent-300" />
                        <span className="font-bold text-white text-lg">{L("ಒಟ್ಟು ಸಾಲ ಮೊತ್ತ — Total Loan Requested")}</span>
                    </div>
                    <InputField
                        label="ಅಪೇಕ್ಷಿಸಿರುವ ಸಾಲದ ಮೊತ್ತ — Loan Amount Requested (₹) *"
                        type="number"
                        register={register('loan_amount', { required: true })}
                        placeholder="Total loan amount requested"
                        variant="dark"
                        readOnly={schemeType === 'TRACTOR'}
                    />
                </div>

                {/* Submit */}
                <Button type="submit" size="lg" className="w-full py-7 text-lg rounded-2xl shadow-lg">
                    <Save size={20} />
                    {id ? L('ಅಪ್ಡೇಟ್ ಮಾಡಿ — Update Application') : L('ಸಲ್ಲಿಸಿ — Submit Application')}
                </Button>

            </form>
        </div>
    );
};

export default NewApplication;
