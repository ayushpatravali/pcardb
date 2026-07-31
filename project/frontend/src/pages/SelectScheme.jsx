import { Link } from 'react-router-dom';
import { Tractor, Sprout, Footprints, Settings, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const COLOR_MAP = {
    blue: { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-100' },
    green: { bg: 'bg-green-600', text: 'text-green-600', light: 'bg-green-100' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-100' },
    indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', light: 'bg-indigo-100' },
    purple: { bg: 'bg-purple-600', text: 'text-purple-600', light: 'bg-purple-100' },
    indigo400: { bg: 'bg-indigo-400', text: 'text-indigo-500', light: 'bg-indigo-100' },
    indigo300: { bg: 'bg-indigo-300', text: 'text-indigo-400', light: 'bg-indigo-50' }
};

const SchemeCard = ({ title, desc, link, icon, colorKey }) => {
    const theme = COLOR_MAP[colorKey] || COLOR_MAP['blue'];

    return (
        <Link to={link} className="block group relative bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
            <div className={`absolute top-0 left-0 w-2 h-full ${theme.bg}`}></div>
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-14 h-14 rounded-2xl ${theme.light} ${theme.text} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        {icon}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ArrowRight size={16} />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{desc}</p>
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
