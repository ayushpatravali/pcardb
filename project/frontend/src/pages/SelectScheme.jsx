import { Link } from 'react-router-dom';
import { Tractor, Sprout, Footprints, Settings, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const COLOR_MAP = {
    blue: { bg: 'bg-primary-700', text: 'text-primary-700', light: 'bg-primary-100' },
    green: { bg: 'bg-emerald-600', text: 'text-emerald-700', light: 'bg-emerald-100' },
    orange: { bg: 'bg-accent-500', text: 'text-accent-700', light: 'bg-accent-100' },
    indigo: { bg: 'bg-primary-500', text: 'text-primary-600', light: 'bg-primary-50' },
    purple: { bg: 'bg-stone-500', text: 'text-stone-600', light: 'bg-stone-100' },
    indigo400: { bg: 'bg-primary-400', text: 'text-primary-500', light: 'bg-primary-50' },
    indigo300: { bg: 'bg-primary-300', text: 'text-primary-400', light: 'bg-primary-50' }
};

const SchemeCard = ({ title, desc, link, icon, colorKey }) => {
    const theme = COLOR_MAP[colorKey] || COLOR_MAP['blue'];

    return (
        <Link to={link} className="block group relative bg-white border border-stone-200/70 rounded-2xl shadow-card hover:shadow-lg hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${theme.bg}`}></div>
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-14 h-14 rounded-2xl ${theme.light} ${theme.text} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                        {icon}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-primary-700 group-hover:text-white transition-colors">
                        <ArrowRight size={16} />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-stone-800 mb-2 group-hover:text-primary-700 transition-colors">{title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed mb-4">{desc}</p>
            </div>
        </Link>
    );
};

const SelectScheme = () => {
    const { t } = useLanguage();

    return (
        <div>
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('selectSchemeTitle')}</h1>
                <p className="text-gray-600">{t('selectSchemeDesc')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SchemeCard
                    title={t('tractorScheme')}
                    desc={t('tractorDesc')}
                    link="/application/new?scheme=TRACTOR"
                    icon={<Tractor size={28} />}
                    colorKey="blue"
                />
                <SchemeCard
                    title={t('landScheme')}
                    desc={t('landDesc')}
                    link="/application/new?scheme=LAND_DEV"
                    icon={<Sprout size={28} />}
                    colorKey="green"
                />
                <SchemeCard
                    title={t('bullockScheme')}
                    desc={t('bullockDesc')}
                    link="/application/new?scheme=BULLOCK"
                    icon={<Settings size={28} />}
                    colorKey="orange"
                />
                <SchemeCard
                    title={t('sheep40')}
                    desc={t('sheep40Desc')}
                    link="/application/new?scheme=SHEEP_40"
                    icon={<Footprints size={28} />}
                    colorKey="indigo"
                />
                <SchemeCard
                    title={t('sheep20')}
                    desc={t('sheep20Desc')}
                    link="/application/new?scheme=SHEEP_20"
                    icon={<Footprints size={28} />}
                    colorKey="indigo400"
                />
                <SchemeCard
                    title={t('sheep10')}
                    desc={t('sheep10Desc')}
                    link="/application/new?scheme=SHEEP_10"
                    icon={<Footprints size={28} />}
                    colorKey="indigo300"
                />
            </div>
        </div>
    );
};

export default SelectScheme;
