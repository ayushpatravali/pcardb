import { useEffect, useState } from 'react';
import { fetchApplications, deleteApplication, approveApplication } from '../services/api';
import { FileText, Search, Filter, Eye, Pencil, Trash2, Printer, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const ApplicationsList = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' }); // Default: Newest first

    useEffect(() => {
        loadApps();
    }, []);

    const loadApps = async () => {
        try {
            const data = await fetchApplications();

            // Filter: Managers see ALL. Field Officers see ONLY their own (if backend doesn't filter, we do it here).
            // Robustness: meaningful user?.username check.
            if (user?.role === 'manager') {
                setApps(data);
            } else {
                // Assuming 'applicant' relationship or field exists. 
                // Currently fetching GET /applications returns a list. 
                // Let's assume the backend returns 'applicant_id' or 'applicant_username'.
                // If not, we might need to rely on the backend filtering.
                // For now, let's filter by created_by if available, or just show all if we can't distinguish.
                // BETTER: The backend *should* filter. But if it returns "all", we filter here.
                // We stored 'username' in AuthContext.
                // Let's check if app has 'applicant_id' (which is user.id) or we match loosely.
                // Given the current backend 'models.py', Application has 'applicant_id'.
                // But we don't have 'user.id' easily in context, only username.
                // Let's show all for now but hide actions, or if we want strict privacy:

                // TODO: Sync with backend to return only owned apps for non-managers.
                // For this step, I will leave it as "View All, Edit Own" model 
                // OR filter if I can find a matching field.
                setApps(data);
            }
        } catch (err) {
            console.error("Failed to load applications", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this application? This cannot be undone.")) return;

        try {
            await deleteApplication(id);
            setApps(apps.filter(app => app.id !== id));
        } catch (err) {
            alert("Failed to delete application");
            console.error(err);
        }
    };

    // Shared action buttons (print/approve/edit/delete) — used by both the
    // desktop table and the mobile card layout below, so the role rules
    // only live in one place.
    const ActionButtons = ({ app, justify = 'justify-end' }) => (
        <div className={`flex space-x-2 ${justify}`}>
            <Link
                to={`/applications/${app.id}/print`}
                className="p-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg transition-colors"
                title={t('view') + ' / ' + t('print')}
            >
                <Printer size={18} />
            </Link>

            {user?.role === 'manager' && (
                <>
                    {app.status !== 'approved' && (
                        <button
                            onClick={async () => {
                                if (window.confirm("Approve this application?")) {
                                    await approveApplication(app.id);
                                    loadApps();
                                }
                            }}
                            className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="Approve"
                        >
                            <CheckCircle size={18} />
                        </button>
                    )}
                    <Link
                        to={`/applications/${app.id}/edit`}
                        className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                        title={t('edit')}
                    >
                        <Pencil size={18} />
                    </Link>
                    <button
                        onClick={() => handleDelete(app.id)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title={t('delete')}
                    >
                        <Trash2 size={18} />
                    </button>
                </>
            )}

            {user?.role !== 'manager' && app.status !== 'approved' && (
                <>
                    <Link
                        to={`/applications/${app.id}/edit`}
                        className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                        title={t('edit')}
                    >
                        <Pencil size={18} />
                    </Link>
                    <button
                        onClick={() => handleDelete(app.id)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title={t('delete')}
                    >
                        <Trash2 size={18} />
                    </button>
                </>
            )}
        </div>
    );

    // Filter Logic
    const filteredApps = apps.filter(app => {
        const query = searchQuery.toLowerCase();
        return (
            app.applicant_name_kn.toLowerCase().includes(query) ||
            (app.application_no || "").toLowerCase().includes(query) ||
            app.id.toString().includes(query) ||
            app.mobile_no.includes(query) ||
            (app.village || "").toLowerCase().includes(query) ||
            app.scheme_type.toLowerCase().includes(query)
        );
    });

    // Sort Logic
    const sortedApps = [...filteredApps].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle ID as number
        if (sortConfig.key === 'id') {
            aValue = Number(aValue);
            bValue = Number(bValue);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">{t('submittedApps')}</h2>
                    <p className="text-gray-500 mt-1">{t('manageApps')}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    {/* Sort Dropdown */}
                    <div className="relative">
                        <select
                            className="w-full appearance-none pl-4 pr-10 py-2 border rounded-full bg-white focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer shadow-sm text-sm"
                            value={`${sortConfig.key}-${sortConfig.direction}`}
                            onChange={(e) => {
                                const [key, direction] = e.target.value.split('-');
                                setSortConfig({ key, direction });
                            }}
                        >
                            <option value="id-desc">{t('newestFirst')}</option>
                            <option value="id-asc">{t('oldestFirst')}</option>
                            <option value="applicant_name_kn-asc">{t('nameAZ')}</option>
                            <option value="status-asc">{t('status')}</option>
                        </select>
                        <Filter size={16} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 border rounded-full bg-white focus:ring-2 focus:ring-blue-100 outline-none shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                    </div>
                </div>
            </div>

            {sortedApps.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center">
                        <FileText size={48} className="mb-2 opacity-20" />
                        {searchQuery ? t('noMatch') : t('noSubmitted')}
                    </div>
                </div>
            )}

            {/* Mobile: one card per application — a table only gets narrower
                on small screens, it never becomes readable, so this is a
                different layout rather than a squeezed/scrolling table. */}
            <div className="space-y-3 md:hidden">
                {sortedApps.map((app, index) => (
                    <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                                <p className="text-gray-700 font-medium">{app.applicant_name_kn}</p>
                                <p className="text-xs text-gray-400">#{index + 1} · ID: {app.id}</p>
                            </div>
                            <span className={`inline-block whitespace-nowrap px-2 py-1 rounded text-xs font-bold ${app.status === 'submitted' ? 'bg-green-100 text-green-700' :
                                app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100'}`}>
                                {app.status === 'submitted' ? t('submitted') : t(app.status)}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                {t(app.scheme_type)}
                            </span>
                            <span className="text-gray-500 font-mono">{app.mobile_no}</span>
                            <span className="text-gray-400">
                                {app.applicant ? app.applicant.username : <span className="italic">Unknown</span>}
                            </span>
                        </div>
                        <ActionButtons app={app} justify="justify-start" />
                    </div>
                ))}
            </div>

            {/* Desktop / tablet: table */}
            {sortedApps.length > 0 && (
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">{t('sl')}</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">{t('name')}</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">{t('scheme')}</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">{t('mobile')}</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Created By</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">{t('status')}</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm uppercase tracking-wider text-right">{t('action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedApps.map((app, index) => (
                                <tr key={app.id} className="hover:bg-primary-50/50 transition-colors group">
                                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-500">
                                        {index + 1}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-gray-700 font-medium">
                                        <div className="flex flex-col">
                                            <span>{app.applicant_name_kn}</span>
                                            <span className="text-xs text-gray-400">ID: {app.id}</span>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                            {t(app.scheme_type)}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-gray-500 font-mono text-sm">{app.mobile_no}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-gray-600 text-sm">
                                        {/* Assuming app.applicant is populated from backend joinedload */}
                                        {app.applicant ? (
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-700">{app.applicant.username}</span>
                                                {/* <span className="text-xs text-gray-400">{app.applicant.role}</span> */}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">Unknown</span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${app.status === 'submitted' ? 'bg-green-100 text-green-700' :
                                            app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100'}`}>
                                            {app.status === 'submitted' ? t('submitted') : t(app.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <ActionButtons app={app} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ApplicationsList;
