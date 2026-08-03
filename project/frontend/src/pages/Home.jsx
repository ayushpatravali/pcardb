import { Link, useNavigate } from 'react-router-dom';
import { Tractor, Sprout, Footprints, Settings, ArrowRight, Activity, Clock, FileText, Eye, Pencil, Filter, CheckSquare, Square } from 'lucide-react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { fetchStats, approveApplication } from '../services/api';
import { useEffect, useState } from 'react';

const STAT_TONES = {
    primary: 'bg-primary-100 text-primary-700',
    amber: 'bg-accent-100 text-accent-700',
    green: 'bg-emerald-100 text-emerald-700',
};

const StatCard = ({ label, value, icon, tone = 'primary', subLabel, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay }}
        className="flex items-center space-x-4 rounded-2xl border border-stone-200/70 bg-white p-6 shadow-card"
    >
        <div className={`rounded-xl p-3.5 ${STAT_TONES[tone]}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-stone-500">{label}</p>
            <h4 className="text-3xl font-bold tracking-tight text-stone-900">{value}</h4>
            {subLabel && <p className="mt-0.5 text-xs text-stone-400">{subLabel}</p>}
        </div>
    </motion.div>
);

const StatusDonut = ({ approved, pending }) => {
    const data = [
        { name: 'Approved', value: approved },
        { name: 'Pending', value: pending },
    ];
    const COLORS = ['#2b6e4a', '#d4a53c'];
    const empty = approved + pending === 0;
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}
            className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-card"
        >
            <p className="text-sm font-medium text-stone-500">Status overview</p>
            <div className="flex items-center">
                <div className="h-24 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={empty ? [{ name: '—', value: 1 }] : data}
                                dataKey="value" innerRadius={28} outerRadius={44}
                                strokeWidth={2} paddingAngle={empty ? 0 : 3}
                            >
                                {(empty ? [0] : data).map((_, i) => (
                                    <Cell key={i} fill={empty ? '#e7e5e4' : COLORS[i]} />
                                ))}
                            </Pie>
                            {!empty && <Tooltip formatter={(v, n) => [v, n]} />}
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="ml-2 space-y-1.5 text-xs">
                    <p className="flex items-center gap-2 text-stone-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[0] }} /> Approved · <b>{approved}</b>
                    </p>
                    <p className="flex items-center gap-2 text-stone-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[1] }} /> Pending · <b>{pending}</b>
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

const Home = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ total_applications: 0, pending_applications: 0, recent_applications: [] });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' }); // Sort State

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await fetchStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
                if (error.response && error.response.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, [navigate]);

    const handleQuickApprove = async (e, id) => {
        e.stopPropagation(); // Prevent row click
        if (!window.confirm("Approve this application?")) return;

        try {
            await approveApplication(id);
            // Optimistic Update
            setStats(prev => ({
                ...prev,
                pending_applications: prev.pending_applications - 1,
                recent_applications: prev.recent_applications.map(app =>
                    app.id === id ? { ...app, status: 'approved' } : app
                )
            }));
        } catch (err) {
            console.error(err);
            alert("Failed to approve");
        }
    };

    // 1. Filter
    const filteredRecent = stats.recent_applications.filter(app => {
        if (filter === 'all') return true;
        return app.status === filter;
    });

    // 2. Sort
    const sortedRecent = [...filteredRecent].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'created_at') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const isManager = localStorage.getItem('role') === 'manager';

    return (
        <div>
            {/* Header & Stats */}
            <div className="mb-10">
                <h1 className="mb-1 text-3xl font-bold tracking-tight text-stone-900">
                    {t('dashboard')}
                </h1>
                <p className="mb-8 text-sm text-stone-500">ದಿ ಗೋಕಾಕ ತಾ. ಪ್ರಾ. ಸ. ಕೃ. ಮತ್ತು ಗ್ರಾ. ಅ. ಬ್ಯಾಂಕ ನಿ.</p>

                <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label={t('totalApps')}
                        value={stats.total_applications}
                        icon={<FileText size={22} />}
                        tone="primary"
                        subLabel={t('allTime')}
                    />
                    <StatCard
                        label={t('pendingReview')}
                        value={stats.pending_applications}
                        icon={<Clock size={22} />}
                        tone="amber"
                        subLabel={t('awaitingApp')}
                        delay={0.05}
                    />
                    <StatCard
                        label={t('approvedActive')}
                        value={stats.total_applications - stats.pending_applications}
                        icon={<Activity size={22} />}
                        tone="green"
                        subLabel={t('processed')}
                        delay={0.1}
                    />
                    <StatusDonut
                        approved={stats.total_applications - stats.pending_applications}
                        pending={stats.pending_applications}
                    />
                </div>
            </div>

            {/* Recent Activity Section */}
            <div>
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 w-full xl:w-auto">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center shrink-0">
                            {t('recentActivity')}
                        </h2>

                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            {/* Filter Tabs */}
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {t('all')}
                                </button>
                                <button
                                    onClick={() => setFilter('submitted')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'submitted' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {t('pending')}
                                </button>
                                <button
                                    onClick={() => setFilter('approved')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'approved' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {t('approved')}
                                </button>
                            </div>

                            {/* Sort Dropdown */}
                            <div className="relative">
                                <select
                                    className="appearance-none pl-3 pr-8 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer shadow-sm text-sm h-[38px]"
                                    value={`${sortConfig.key}-${sortConfig.direction}`}
                                    onChange={(e) => {
                                        const [key, direction] = e.target.value.split('-');
                                        setSortConfig({ key, direction });
                                    }}
                                >
                                    <option value="created_at-desc">{t('newestFirst')}</option>
                                    <option value="created_at-asc">{t('oldestFirst')}</option>
                                    <option value="applicant_name_kn-asc">{t('nameAZ')}</option>
                                </select>
                                <Filter size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <Link to="/select-scheme" className="bg-primary-700 hover:bg-primary-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center shrink-0">
                        <FileText size={18} className="mr-2" />
                        {t('newApplication')}
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {sortedRecent.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">{isManager ? t('id') : t('sl')}</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">{t('name')}</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">{t('scheme')}</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">{t('status')}</th>
                                    <th className="p-4 font-semibold text-gray-600 text-sm">{t('date')}</th>
                                    {/* Action Column for Manager */}
                                    {isManager && <th className="p-4 font-semibold text-gray-600 text-sm text-center">{t('action')}</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {sortedRecent.map((app, index) => {
                                    // Officer: Sequential Ranking (Total - Index). Manager: Global ID
                                    const displayId = isManager ? `#${app.id}` : (index + 1);

                                    return (
                                        <tr key={app.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => navigate(`/applications/${app.id}/print`)}>
                                            <td className="p-4 text-primary-700 font-medium group-hover:underline">
                                                {displayId}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900 font-medium">{app.applicant_name_kn}</span>
                                                    {app.applicant && (
                                                        <span className="text-xs text-gray-400">
                                                            {t('by')}: {app.applicant.full_name || app.applicant.username}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                                    {t(app.scheme_type)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                                                    ${app.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                                        app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                                                    {app.status === 'submitted' ? t('submitted') : t(app.status)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500 text-sm">
                                                {new Date(app.created_at).toLocaleDateString()}
                                            </td>
                                            {/* Approval Checkbox for Manager */}
                                            {isManager && (
                                                <td className="p-4 text-center">
                                                    {app.status === 'submitted' ? (
                                                        <button
                                                            onClick={(e) => handleQuickApprove(e, app.id)}
                                                            className="text-gray-400 hover:text-emerald-600 transition-colors p-2"
                                                            title={t('approveAction')}
                                                        >
                                                            <Square size={24} strokeWidth={2} />
                                                        </button>
                                                    ) : (
                                                        <span className="text-emerald-600 flex justify-center">
                                                            <CheckSquare size={24} strokeWidth={2} />
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-10 text-center text-gray-500">
                            <p>{t('noApps')}</p>
                            <Link to="/select-scheme" className="text-primary-700 font-medium mt-2 inline-block">{t('startOne')}</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
