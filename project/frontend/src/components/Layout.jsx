import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, FilePlus, Database, LogOut, Menu, Languages, Landmark } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { language, toggleLanguage, t } = useLanguage();

    // Fallback if user is null (should be handled by ProtectedRoute but safe to have)
    const role = user?.role;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const NavItem = ({ to, icon, label }) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                className={`mb-1 flex items-center rounded-xl px-4 py-2.5 text-sm transition-colors ${
                    isActive
                        ? 'bg-white/10 font-semibold text-white shadow-inner'
                        : 'text-primary-200 hover:bg-white/5 hover:text-white'
                }`}
            >
                <span className={isActive ? 'text-accent-300' : 'text-primary-300'}>{icon}</span>
                <span className="ml-3">{label}</span>
            </Link>
        )
    }

    return (
        <div className="flex h-screen bg-surface">
            {/* Sidebar */}
            <aside className="hidden w-64 flex-col bg-primary-950 md:flex">
                <div className="flex items-center gap-3 px-5 py-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-400 text-primary-950 shadow">
                        <Landmark size={20} />
                    </div>
                    <div className="leading-tight">
                        <p className="text-sm font-bold text-white">PCARD Bank</p>
                        <p className="text-[11px] text-primary-300">ಗೋಕಾಕ · ಸಾಲ ಅರ್ಜಿ ವ್ಯವಸ್ಥೆ</p>
                    </div>
                </div>
                <div className="mx-5 border-t border-white/10" />

                <nav className="flex-1 overflow-y-auto p-4">
                    <div className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-400">Menu</div>
                    <NavItem to="/" icon={<Home size={18} />} label={t('dashboard')} />
                    <NavItem to="/select-scheme" icon={<FilePlus size={18} />} label={t('newApplication')} />
                    {role === 'manager' && (
                        <NavItem to="/applications" icon={<Database size={18} />} label={t('allApplications')} />
                    )}
                </nav>

                <div className="p-4">
                    {/* Language Toggle */}
                    <button
                        onClick={toggleLanguage}
                        className="mb-3 flex w-full items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-primary-100 transition hover:bg-white/10"
                    >
                        <Languages size={15} className="mr-2 text-accent-300" />
                        {language === 'en' ? 'ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ' : 'Switch to English'}
                    </button>

                    <div className="mb-3 flex items-center rounded-xl bg-white/5 px-4 py-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-400 text-sm font-bold text-primary-950">
                            {role ? role[0].toUpperCase() : 'U'}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium capitalize text-white">{role || 'User'}</p>
                            <p className="text-[11px] text-primary-300">Active Session</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center rounded-xl px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                    >
                        <LogOut size={15} className="mr-2" />
                        {t('logout')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex flex-1 flex-col overflow-auto">
                <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-8 py-4 md:hidden">
                    <div className="flex items-center gap-2 font-bold text-primary-800">
                        <Landmark size={18} className="text-accent-500" /> PCARD Bank
                    </div>
                    <button className="rounded p-1 hover:bg-stone-100"><Menu /></button>
                </header>

                <div className="mx-auto w-full max-w-7xl flex-1 p-6 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
