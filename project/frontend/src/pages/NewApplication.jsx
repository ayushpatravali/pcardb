import { useForm, useFieldArray } from 'react-hook-form';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import api, { getApplication, updateApplication } from '../services/api';
import React from 'react';
import { FileText, Car, Sprout, Clipboard, ChevronRight, Save, Plus, Trash2, Calculator } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { calculateTractorLoanSummary } from '../utils/tractorFormCalculations.mjs';
import { calculateTractorLoanFields } from '../utils/tractorCalculations';

// ── Scheme Config ─────────────────────────────────────────────────────────────
const SCHEME_CONFIG = {
    'TRACTOR':  { titleKey: 'tractorScheme', title: 'Tractor Purchase Scheme',   icon: <Car size={32} />,       gradient: 'from-blue-700 to-blue-900',    color: 'blue'   },
    'LAND_DEV': { titleKey: 'landScheme',    title: 'Land Development Scheme',    icon: <Sprout size={32} />,    gradient: 'from-green-700 to-green-900',  color: 'green'  },
    'SHEEP_40': { titleKey: 'sheep40',       title: 'Sheep Rearing (40+2)',       icon: <Clipboard size={32} />, gradient: 'from-indigo-700 to-indigo-900',color: 'indigo' },
    'SHEEP_20': { titleKey: 'sheep20',       title: 'Sheep Rearing (20+1)',       icon: <Clipboard size={32} />, gradient: 'from-purple-700 to-purple-900',color: 'purple' },
    'SHEEP_10': { titleKey: 'sheep10',       title: 'Sheep Rearing (10+1)',       icon: <Clipboard size={32} />, gradient: 'from-indigo-500 to-indigo-800',color: 'indigo' },
    'BULLOCK':  { titleKey: 'bullockScheme', title: 'Bullock & Cart Scheme',      icon: <FileText size={32} />,  gradient: 'from-orange-600 to-orange-800',color: 'orange' },
};

// ── Dropdown Options ──────────────────────────────────────────────────────────
const CROP_CHART = {
    Sugarcane: 78793,
    Rice: 11882,
    Jowar: 14914,
    Maize: 13793,
    Wheat: 9722,
    Cotton: 13772,
    Groundnut: 22120,
    Sunflower: 9648,
    Soybean: 7539,
    Tomato: 78793,
    Onion: 23800,
    Chilli: 21000,
    Banana: 79965,
    Grapes: 165473,
    Other: 20000,
};
const CROP_OPTIONS = [
    { value: '', label: '' },
    { value: 'Sugarcane', label: 'ಕಬ್ಬು (Sugarcane)' },
    { value: 'Rice', label: 'ಭತ್ತ (Rice)' },
    { value: 'Jowar', label: 'ಜೋಳ (Jowar)' },
    { value: 'Maize', label: 'ಮೆಕ್ಕೆ ಜೋಳ (Maize)' },
    { value: 'Wheat', label: 'ಗೋಧಿ (Wheat)' },
    { value: 'Cotton', label: 'ಹತ್ತಿ (Cotton)' },
    { value: 'Groundnut', label: 'ಶೇಂಗಾ (Groundnut)' },
    { value: 'Sunflower', label: 'ಸೂರ್ಯಕಾಂತಿ (Sunflower)' },
    { value: 'Soybean', label: 'ಸೋಯಾಬೀನ್ (Soybean)' },
    { value: 'Tomato', label: 'ಟೊಮ್ಯಾಟೋ (Tomato)' },
    { value: 'Onion', label: 'ಈರುಳ್ಳಿ (Onion)' },
    { value: 'Chilli', label: 'ಮೆಣಸಿನಕಾಯಿ (Chilli)' },
    { value: 'Banana', label: 'ಬಾಳೆ (Banana)' },
    { value: 'Grapes', label: 'ದ್ರಾಕ್ಷಿ (Grapes)' },
    { value: 'Other', label: 'ಇತರೆ (Other)' },
];
const CROP_LABEL_MAP = {
    'ಕಬ್ಬು (Sugarcane)': 'Sugarcane',
    'ಭತ್ತ (Rice)': 'Rice',
    'ಜೋಳ (Jowar)': 'Jowar',
    'ಮೆಕ್ಕೆ ಜೋಳ (Maize)': 'Maize',
    'ಗೋಧಿ (Wheat)': 'Wheat',
    'ಹತ್ತಿ (Cotton)': 'Cotton',
    'ಶೇಂಗಾ (Groundnut)': 'Groundnut',
    'ಸೂರ್ಯಕಾಂತಿ (Sunflower)': 'Sunflower',
    'ಸೋಯಾಬೀನ್ (Soybean)': 'Soybean',
    'ಟೊಮ್ಯಾಟೋ (Tomato)': 'Tomato',
    'ಈರುಳ್ಳಿ (Onion)': 'Onion',
    'ಮೆಣಸಿನಕಾಯಿ (Chilli)': 'Chilli',
    'ಬಾಳೆ (Banana)': 'Banana',
    'ದ್ರಾಕ್ಷಿ (Grapes)': 'Grapes',
    'ಇತರೆ (Other)': 'Other',
};

const IRRIGATION_OPTIONS = [
    'ಕೊಳವೆ ಬಾವಿ (Borewell)', 'ತೆರೆದ ಬಾವಿ (Open Well)', 'ಕಾಲುವೆ (Canal)',
    'ಕೆರೆ (Tank)', 'ನದಿ (River)', 'ಏತ ನೀರಾವರಿ (Lift Irrigation)',
    'ಮಳೆಯಾಶ್ರಿತ (Rain-fed)', 'ಇತರೆ (Other)'
];

const CASTE_OPTIONS = ['General / ಸಾಮಾನ್ಯ', 'SC / ಪರಿಶಿಷ್ಟ ಜಾತಿ', 'ST / ಪರಿಶಿಷ್ಟ ಪಂಗಡ', 'OBC / ಹಿಂದುಳಿದ ವರ್ಗ', 'ಲಿಂಗಾಯತ', 'ವೀರಶೈವ', 'ಕುರುಬ', 'ಇತರೆ'];
const FARMER_OPTIONS = ['ಸಣ್ಣ ರೈತ (Small)', 'ದೊಡ್ಡ ರೈತ (Big)', 'ಅತಿ ಸಣ್ಣ ರೈತ (Marginal)'];
const RELATION_OPTIONS = ['', 'ಪತ್ನಿ/ಪತಿ (Spouse)', 'ಮಗ (Son)', 'ಮಗಳು (Daughter)', 'ತಂದೆ (Father)', 'ತಾಯಿ (Mother)', 'ಸಹೋದರ (Brother)', 'ಇತರೆ (Other)'];

// ── Reusable Components ───────────────────────────────────────────────────────
const SectionHeader = ({ title, icon, color = 'gray' }) => (
    <div className={`flex items-center mb-6 pb-3 border-b-2 border-${color}-100`}>
        <div className={`p-2 bg-${color}-50 rounded-lg mr-3 text-${color}-600`}>
            {icon || <ChevronRight size={18} />}
        </div>
        <h3 className={`text-lg font-bold text-${color}-800`}>{title}</h3>
    </div>
);

const InputField = ({ label, register, type = 'text', placeholder, step, readOnly, className = '', inputProps = {} }) => (
    <div className={`group ${className}`}>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 group-focus-within:text-blue-600 transition-colors">
            {label}
        </label>
        <input
            type={type} step={step}
            min={type === 'number' ? '0' : undefined}
            onWheel={(e) => type === 'number' && e.target.blur()}
            placeholder={placeholder}
            readOnly={readOnly}
            {...register}
            {...inputProps}
            className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-all text-sm
                ${readOnly
                    ? 'bg-gray-100 text-gray-700 font-bold cursor-not-allowed border-gray-200'
                    : 'bg-white text-gray-900 border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white'}`}
        />
    </div>
);

const SelectField = ({ label, register, options, className = '' }) => (
    <div className={`group ${className}`}>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 group-focus-within:text-blue-600 transition-colors">
            {label}
        </label>
        <div className="relative">
            <select {...register}
                className="w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none appearance-none transition-all text-sm">
                {options.map(opt => {
                    const value = typeof opt === 'string' ? opt : opt.value;
                    const labelText = typeof opt === 'string' ? opt : opt.label;
                    return <option key={value} value={value}>{labelText}</option>;
                })}
            </select>
            <div className="absolute right-3 top-3 text-gray-400 pointer-events-none">
                <ChevronRight size={16} className="rotate-90" />
            </div>
        </div>
    </div>
);

const getCropRate = (cropName) => {
    if (!cropName) return 0;
    const normalized = cropName?.toString().trim();
    if (!normalized) return 0;
    if (CROP_CHART[normalized]) return CROP_CHART[normalized];
    return CROP_CHART[CROP_LABEL_MAP[normalized]] || 0;
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
    const { t } = useLanguage();

    const [schemeType, setSchemeType] = React.useState(searchParams.get('scheme') || 'TRACTOR');
    const config = SCHEME_CONFIG[schemeType] || SCHEME_CONFIG['TRACTOR'];

    const { register, handleSubmit, setValue, reset, watch, control, formState: { errors } } = useForm({
        defaultValues: {
            scheme_type: schemeType,
            farmer_type: FARMER_OPTIONS[0],
            caste: CASTE_OPTIONS[0],
            land_parcels: [{ sl: '1', village: '', survey_no: '', acres: '', guntas: '', akaar: '' }],
            crops: [{ crop_name: '', acres: '', guntas: '', annual_income: '' }],
            irrigation_source: [],
            irrigation_hp: {},
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

    // Co-applicants dynamic rows
    const { fields: coAppFields, append: coAppAppend, remove: coAppRemove } = useFieldArray({
        control, name: 'co_applicants'
    });

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

    const calculateCropIncomes = React.useCallback((rows = []) => {
        if (!Array.isArray(rows)) return;
        rows.forEach((crop, index) => {
            const cropName = crop?.crop_name;
            const acres = parseFloat(crop?.acres) || 0;
            const guntas = parseFloat(crop?.guntas) || 0;
            const rate = getCropRate(cropName);
            const totalAcres = acres + (guntas / 40);
            const income = rate > 0 ? Math.round(totalAcres * rate) : '';
            setValue(`crops.${index}.annual_income`, income);
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
        
    // Auto-calculate crop incomes
    React.useEffect(() => {
        calculateCropIncomes(cropsData);
    }, [cropsData, calculateCropIncomes]);

    // Auto-calculate total land area
    React.useEffect(() => {
        calculateLandTotals(landParcels, landValuationRate);
    }, [landParcels, landValuationRate, calculateLandTotals]);

    // Auto-calculate age from dob
    const dob = watch('dob');
    React.useEffect(() => {
        if (dob) {
            const today = new Date();
            const birthDate = new Date(dob);
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
                    application_date: typeof app.application_date === 'string' ? app.application_date.slice(0, 10) : '',
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
                    formData.land_survey_no           = details.survey_no;
                    formData.land_area_acres          = details.area_acres;
                    formData.land_assessment          = details.assessment;
                    formData.land_type                = details.land_type;
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
            'annual_income', 'loan_amount', 'borrower_type',
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
            current_crop: JSON.stringify(data.crops || []),
            irrigation_source: irrigationSources
                .map((source) => {
                    const key = sanitizeIrrigationKey(source);
                    const hp = data.irrigation_hp?.[key];
                    return hp ? `${source} (${hp} HP)` : source;
                })
                .join(', ')
        };

        headerFields.forEach(k => { if (data[k] !== undefined && k !== 'current_crop') payload[k] = data[k]; });

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
            payload.land_details = {
                survey_no:  data.land_survey_no || null,
                area_acres: data.land_area_acres ? parseFloat(data.land_area_acres) : null,
                assessment: data.land_assessment ? parseFloat(data.land_assessment) : null,
                land_type:  data.land_type || null,
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
            } else {
                await api.post('/applications/', payload);
                alert('Application Submitted Successfully!');
            }
            navigate('/applications');
        } catch (err) {
            console.error('Save Error:', err);
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
        <div className="max-w-5xl mx-auto pb-20">

            {/* Header Banner */}
            <div className={`bg-gradient-to-br ${config.gradient} rounded-3xl p-10 mb-8 text-white shadow-2xl relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl" />
                <div className="relative z-10 flex items-center">
                    <div className="p-4 bg-white/10 rounded-2xl mr-6 backdrop-blur-md border border-white/20">
                        {config.icon}
                    </div>
                    <div>
                        <h2 className="text-4xl font-black tracking-tight text-white mb-2 drop-shadow-md">
                            {t(config.titleKey || 'tractorScheme')}
                        </h2>
                        <p className="text-blue-100 text-lg font-medium opacity-90">
                            Fill in the details below to submit the loan application
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    ಕನ್ನಡದಲ್ಲಿ ನಮೂದಿಸಿ — ಹೆಸರು, ಗ್ರಾಮ, 주소 ಮತ್ತು ಇತರ Kannada ಕ್ಷೇತ್ರಗಳಿಗೆ ಕನ್ನಡವನ್ನು ಬಳಸಿ. IFSC, ಖಾತೆ ಸಂಖ್ಯೆ, ಮೊಬೈಲ್ ಮತ್ತು ಆಧಾರ್ ಕ್ಷೇತ್ರಗಳಿಗೆ ಇಂಗ್ಲಿಷ್/ಆಂಕಿ ಅಕ್ಷರಗಳನ್ನು ಹಾಗೆಯೇ ಉಳಿಸಲಾಗುವುದು.
                </div>

                {/* ── 1. APPLICANT DETAILS ── */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <SectionHeader title="ಅರ್ಜಿದಾರ ವಿವರ — Applicant Details" color="blue" />

                    <div className="mb-6 max-w-xs">
                        <InputField label="ಅರ್ಜಿ ದಿನಾಂಕ — Application Date" type="date"
                            register={register('application_date')} />
                        <p className="text-xs text-gray-400 mt-1">
                            ಖಾಲಿ ಬಿಟ್ಟರೆ ಇಂದಿನ ದಿನಾಂಕ — leave blank to use today's date on the printed form
                        </p>
                    </div>

                    {/* Name split into 3 */}
                    <div className="mb-6">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            ಅರ್ಜಿದಾರ ಹೆಸರು — Full Name *
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            <InputField label="First Name (ಮೊದಲ ಹೆಸರು)"
                                register={register('name_first', { required: true })}
                                placeholder="ರಮೇಶ" />
                            <InputField label="Middle Name (Husband/Father Name)"
                                register={register('name_middle')}
                                placeholder="ಕುಮಾರ" />
                            <InputField label="Last Name / Surname (ಹೆಚ್ಚಿನ ಹೆಸರು)"
                                register={register('name_last', { required: true })}
                                placeholder="ಪಾಟೀಲ" />
                        </div>
                        {(errors.name_first || errors.name_last) && (
                            <p className="text-red-500 text-xs mt-1">First name and last name are required</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                        <div className="grid grid-cols-3 gap-3 md:col-span-2">
                            <InputField label="ಜನಿಸಿದ ದಿನಾಂಕ — DOB" type="date"
                                register={register('dob')} />
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

                        <SelectField label="ಜಾತಿ — Caste"
                            register={register('caste')}
                            options={CASTE_OPTIONS} />
                        <div className="grid grid-cols-2 gap-3">
                            <SelectField label="ರೈತ ವರ್ಗ — Farmer Type"
                                register={register('farmer_type')}
                                options={FARMER_OPTIONS} />
                            <SelectField label="ಸಾಲಗಾರ ವಿಧ — Borrower Type"
                                register={register('borrower_type')}
                                options={['New / ಹೊಸ', 'Old / ಹಿಂದಿನ']} />
                        </div>

                        {/* Previous-loan details: only for old borrowers; prints on PDF page 9 section 9) */}
                        {isOldBorrower && (
                            <div className="md:col-span-2 mt-2 p-4 border border-orange-200 bg-orange-50/50 rounded-xl">
                                <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-3">
                                    ಹಿಂದಿನ ಸಾಲದ ವಿವರ — Previous Loan Details (ಹಳೇ ಸಾಲಗಾರರಿಗೆ)
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
                                    ಸಹ ಅರ್ಜಿದಾರರು — Co-Applicants (Optional)
                                </p>
                                <button
                                    type="button"
                                    onClick={() => coAppAppend({ name: '', relation: '' })}
                                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    <Plus size={14} /> ಸೇರಿಸಿ (Add)
                                </button>
                            </div>
                            
                            <div className="space-y-3">
                                {coAppFields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
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
                                    <p className="text-sm text-gray-400 italic">No co-applicants added.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 2. ADDRESS ── */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <SectionHeader title="ವಾಸಸ್ಥಳ ವಿಳಾಸ — Residential Address" color="green" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        <InputField label="ಗ್ರಾಮ — Village *" register={register('village', { required: true })} inputProps={{ lang: 'kn' }} />
                        <InputField label="ಹೋಬಳಿ — Hobli *" register={register('hobli', { required: true })} inputProps={{ lang: 'kn' }} />
                        <InputField label="ತಾಲೂಕ — Taluk *" register={register('taluk', { required: true })} inputProps={{ lang: 'kn' }} />
                        <InputField label="ಜಿಲ್ಲೆ — District *" register={register('district', { required: true })} inputProps={{ lang: 'kn' }} />
                    </div>
                </div>

                {/* ── 3. LAND DETAILS ── */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <SectionHeader title="ಭೂ ವಿವರ — Land Details" icon={<Sprout size={18} />} color="green" />

                    {schemeType === 'TRACTOR' && (
                        <div className="mb-4 max-w-sm">
                            <label className="block text-xs font-bold text-green-800 mb-1">
                                ಜಮೀನಿನ ಮೌಲ್ಯ (ಪ್ರತಿ ಎಕರೆಗೆ) — Land Valuation per Acre (₹)
                            </label>
                            <input
                                type="number" step="1"
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
                                    <th className="border border-green-200 px-3 py-2 text-left text-xs font-bold text-green-800">ಗ್ರಾಮ — Village</th>
                                    <th className="border border-green-200 px-3 py-2 text-left text-xs font-bold text-green-800">ಸರ್ವೆ ನಂ — Survey No</th>
                                    <th className="border border-green-200 px-3 py-2 text-left text-xs font-bold text-green-800">ಎಕರೆ — Acres</th>
                                    <th className="border border-green-200 px-3 py-2 text-left text-xs font-bold text-green-800">ಗುಂಟೆ — Guntas</th>
                                    <th className="border border-green-200 px-3 py-2 text-left text-xs font-bold text-green-800">ಆಕಾರ — Akaar</th>
                                    {schemeType === 'TRACTOR' && (
                                        <th className="border border-green-200 px-3 py-2 text-left text-xs font-bold text-green-800">ಜಮೀನಿನ ಮೌಲ್ಯ — Land Value</th>
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
                                                className="w-full px-2 py-1.5 text-sm outline-none bg-transparent focus:bg-blue-50 rounded"
                                            />
                                        </td>
                                        <td className="border border-gray-200 px-1 py-1">
                                            <input
                                                {...register(`land_parcels.${index}.survey_no`)}
                                                placeholder="123/A"
                                                className="w-full px-2 py-1.5 text-sm outline-none bg-transparent focus:bg-blue-50 rounded"
                                            />
                                        </td>
                                        <td className="border border-gray-200 px-1 py-1">
                                            <input
                                                type="number" step="0.01"
                                                {...register(`land_parcels.${index}.acres`)}
                                                placeholder="0"
                                                className="w-full px-2 py-1.5 text-sm outline-none bg-transparent focus:bg-blue-50 rounded"
                                            />
                                        </td>
                                        <td className="border border-gray-200 px-1 py-1">
                                            <input
                                                type="number"
                                                {...register(`land_parcels.${index}.guntas`)}
                                                placeholder="0"
                                                className="w-full px-2 py-1.5 text-sm outline-none bg-transparent focus:bg-blue-50 rounded"
                                            />
                                        </td>
                                        <td className="border border-gray-200 px-1 py-1">
                                            <input
                                                type="number"
                                                {...register(`land_parcels.${index}.akaar`)}
                                                placeholder="0.00"
                                                className="w-full px-2 py-1.5 text-sm outline-none bg-transparent focus:bg-blue-50 rounded"
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
                                        ಒಟ್ಟು — Total
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

                    <button
                        type="button"
                        onClick={() => landAppend({ sl: String(landFields.length + 1), village: '', survey_no: '', acres: '', guntas: '', akaar: '' })}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                        <Plus size={16} /> ಸಾಲು ಸೇರಿಸಿ — Add Row
                    </button>
                </div>

                {/* ── 4. AGRICULTURE DETAILS ── */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-orange-100">
                    <SectionHeader title="ಕೃಷಿ ವಿವರ — Agriculture Details" icon={<Sprout size={18} />} color="orange" />
                    
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                ಬೆಳೆ ವಿವರ — Crop Details (ವಾರ್ಷಿಕ ಬೆಳೆ)
                            </label>
                            <button
                                type="button"
                                onClick={() => cropsAppend({ crop_name: '', acres: '', guntas: '', annual_income: '' })}
                                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                            >
                                <Plus size={14} /> ಬೆಳೆ ಸೇರಿಸಿ (Add Crop)
                            </button>
                        </div>
                        <div className="space-y-3">
                            {cropsFields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
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
                    
                    {/* Irrigation Checkboxes */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            ನೀರಾವರಿ ಮೂಲ — Irrigation Source (Select Multiple)
                        </label>
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                            ಸೂಚನೆ: ಅಗತ್ಯವಿರುವ ನೀರಾವರಿ ಮೂಲಗಳಿಗೆ ಮಾತ್ರ HP ನಮೂದಿಸಿ — Enter HP only for the resources that require it
                            (e.g. borewell/pumpset). Sources without a motor can be left blank.
                        </p>
                        <div className="grid gap-3 mb-3">
                            {IRRIGATION_OPTIONS.map((opt) => {
                                const key = sanitizeIrrigationKey(opt);
                                const selected = Array.isArray(irrigationSource) && irrigationSource.includes(opt);
                                return (
                                    <label key={opt} className="flex flex-wrap items-center gap-3 px-3 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
                                        <span className="flex items-center gap-2">
                                            <input type="checkbox" value={opt} {...register('irrigation_source')} className="w-4 h-4 text-blue-600 rounded" />
                                            <span>{opt}</span>
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
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
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
                            <p className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 border-b pb-2">1. ಟ್ರ್ಯಾಕ್ಟರ್ — Tractor Details</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <InputField label="ಕಂಪನಿ — Make" register={register('tractor_make')} placeholder="e.g. John Deere" />
                                <InputField label="ಮಾಡೆಲ್ — Model" register={register('tractor_model')} placeholder="e.g. 5310" />
                                <InputField label="ಅಶ್ವಶಕ್ತಿ — HP" register={register('tractor_hp')} placeholder="e.g. 50 HP" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-gray-100">
                                <InputField label="ಡೀಲರ್ — Dealer Name" register={register('tractor_dealer')} placeholder="Dealer name" />
                                <InputField label="ಕೋಟೇಶನ್ — Quotation (₹)" type="number" register={register('tractor_quotation')} placeholder="₹" />
                                <InputField label="ಮುಂಗಡ ಪಾವತಿ — Down Payment (₹)" type="number" register={register('tractor_down_payment')} placeholder="₹" />
                                <InputField label="ಸಾಲ — Loan (Auto ₹)" type="number" register={register('tractor_bank_loan')} readOnly className="bg-blue-50" />
                            </div>
                        </div>

                        {/* 2. Trailer Details */}
                        <div className="mb-6 bg-gray-50 p-5 rounded-xl border border-gray-200">
                            <p className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 border-b pb-2">2. ಟ್ರೇಲರ್ — Trailer Details</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <InputField label="ಕಂಪನಿ — Make" register={register('trailer_make')} placeholder="e.g. Meharin" />
                                <InputField label="ಸಾಮರ್ಥ್ಯ — Capacity" register={register('trailer_capacity')} placeholder="e.g. 3 Ton" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-gray-100">
                                <InputField label="ಡೀಲರ್ — Dealer Name" register={register('trailer_dealer')} placeholder="Dealer name" />
                                <InputField label="ಕೋಟೇಶನ್ — Quotation (₹)" type="number" register={register('trailer_quotation')} placeholder="₹" />
                                <InputField label="ಮುಂಗಡ ಪಾವತಿ — Down Payment (₹)" type="number" register={register('trailer_down_payment')} placeholder="₹" />
                                <InputField label="ಸಾಲ — Loan (Auto ₹)" type="number" register={register('trailer_bank_loan')} readOnly className="bg-blue-50" />
                            </div>
                        </div>

                        {/* 3. Implement Details */}
                        <div className="mb-6 bg-gray-50 p-5 rounded-xl border border-gray-200">
                            <p className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 border-b pb-2">3. ಉಪಕರಣಗಳು — Implements Details</p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-gray-100">
                                <InputField label="ಮೇಕರ್ಸ್/ಡೀಲರ್ — Makers/Dealer" register={register('implement_dealer')} placeholder="Makers or Dealer" />
                                <InputField label="ಕೋಟೇಶನ್ — Quotation (₹)" type="number" register={register('implement_quotation')} placeholder="₹" />
                                <InputField label="ಮುಂಗಡ ಪಾವತಿ — Down Payment (₹)" type="number" register={register('implement_down_payment')} placeholder="₹" />
                                <InputField label="ಸಾಲ — Loan (Auto ₹)" type="number" register={register('implement_bank_loan')} readOnly className="bg-blue-50" />
                            </div>
                        </div>

                        {/* Grand Totals */}
                        <div className="bg-blue-600 border border-blue-700 rounded-xl p-6 text-white shadow-inner">
                            <div className="flex items-center gap-2 mb-4">
                                <Calculator size={20} className="text-blue-200" />
                                <span className="font-bold text-lg">ಒಟ್ಟು — Grand Totals</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <InputField label="ಒಟ್ಟು ಕೋಟೇಶನ್ — Total Quotation (₹)" type="number" register={register('total_quotation')} readOnly className="opacity-90" />
                                <InputField label="ಒಟ್ಟು ಮುಂಗಡ ಪಾವತಿ — Total Down Payment (₹)" type="number" register={register('total_down_payment')} readOnly className="opacity-90" />
                                <InputField label="ಒಟ್ಟು ಸಾಲದ ಮೊತ್ತ — Total Loan Amount (₹)" type="number" register={register('total_loan_amount')} readOnly className="font-bold bg-yellow-400 text-black border-none shadow-md" />
                            </div>
                        </div>
                    </div>
                )}

                {/* SHEEP */}
                {schemeType.includes('SHEEP') && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <SectionHeader title="ಯೋಜನೆ ವೆಚ್ಚ — Project Cost Breakdown" icon={<Clipboard size={18} />} color="indigo" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <InputField label="ಪ್ರಾಣಿ ವೆಚ್ಚ — Animal Cost" type="number" register={register('animal_cost')} />
                            <InputField label="ಕೊಟ್ಟಿಗೆ — Shed Cost" type="number" register={register('shed_cost')} />
                            <InputField label="ಮೇವು — Feed Cost" type="number" register={register('feed_cost')} />
                            <InputField label="ವಿಮೆ — Insurance" type="number" register={register('insurance_amt')} />
                            <InputField label="ಇತರೆ — Miscellaneous" type="number" register={register('misc_cost')} />
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <InputField label="ಒಟ್ಟು ವೆಚ್ಚ — Total (Auto ₹)" register={register('sheep_total_cost')} readOnly />
                            </div>
                        </div>
                    </div>
                )}

                {/* BULLOCK */}
                {schemeType === 'BULLOCK' && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-orange-100">
                        <SectionHeader title="ಎತ್ತು ಬಂಡಿ ವಿವರ — Bullock Cart Details" icon={<FileText size={18} />} color="orange" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InputField label="ಎತ್ತುಗಳ ಬೆಲೆ — Bullock Pair Cost (₹)" type="number" register={register('bullock_cost')} />
                            <InputField label="ಬಂಡಿ ಬೆಲೆ — Cart Cost (₹)" type="number" register={register('cart_cost')} />
                            <InputField label="ಬ್ಯಾಂಕ್ ಸಾಲ — Loan Amount (₹)" type="number" register={register('bullock_loan_amount')} placeholder="Enter loan amount" />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                    <InputField label="ಒಟ್ಟು ವೆಚ್ಚ — Total (Auto ₹)" register={register('bullock_total_cost')} readOnly />
                                </div>
                                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                    <InputField label="ಮಾರ್ಜಿನ್ — Margin (Auto ₹)" register={register('bullock_margin_money')} readOnly />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* LAND DEV */}
                {schemeType === 'LAND_DEV' && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-100">
                        <SectionHeader title="ಭೂ ಅಭಿವೃದ್ಧಿ — Land Development Metrics" icon={<Sprout size={18} />} color="green" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <InputField label="ಸರ್ವೆ ಸಂಖ್ಯೆ — Survey Number" register={register('land_survey_no')} />
                            <InputField label="ಪ್ರದೇಶ — Area (Acres)" type="number" step="0.01" register={register('land_area_acres')} />
                            <InputField label="ಆಕಾರ — Assessment" type="number" register={register('land_assessment')} />
                            <SelectField label="ಭೂ ವಿಧ — Land Type" register={register('land_type')} options={['ಖುಷ್ಕಿ (Dry)', 'ನೀರಾವರಿ (Wet)']} />
                            <InputField label="ಅಭಿವೃದ್ಧಿ ಪೂರ್ವ ಆದಾಯ — Pre-Dev Income" type="number" register={register('land_pre_development_income')} />
                            <InputField label="ಅಭಿವೃದ್ಧಿ ನಂತರ ಆದಾಯ — Post-Dev Income" type="number" register={register('land_post_development_income')} />
                        </div>
                    </div>
                )}

                {/* ── Overall Loan Amount ── */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <Calculator size={20} className="text-yellow-400" />
                        <span className="font-bold text-white text-lg">ಒಟ್ಟು ಸಾಲ ಮೊತ್ತ — Total Loan Requested</span>
                    </div>
                    <InputField
                        label="ಅಪೇಕ್ಷಿಸಿರುವ ಸಾಲದ ಮೊತ್ತ — Loan Amount Requested (₹) *"
                        type="number"
                        register={register('loan_amount', { required: true })}
                        placeholder="Total loan amount requested"
                        className="text-white"                        readOnly={schemeType === 'TRACTOR'}                    />
                </div>

                {/* Submit */}
                <button type="submit"
                    className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition shadow-xl flex items-center justify-center text-lg gap-3">
                    <Save size={20} />
                    {id ? 'ಅಪ್ಡೇಟ್ ಮಾಡಿ — Update Application' : 'ಸಲ್ಲಿಸಿ — Submit Application'}
                </button>

            </form>
        </div>
    );
};

export default NewApplication;
