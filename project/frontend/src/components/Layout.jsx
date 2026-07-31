import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, FilePlus, Database, LogOut, Menu, Languages } from 'lucide-react';
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
            <Link to={to} className={`flex items-center px-4 py-3 rounded-lg transition-colors mb-1 ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                {icon}
                <span className="ml-3">{label}</span>
            </Link>
        )
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r shadow-sm flex flex-col hidden md:flex">
                <div className="p-6 border-b flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg mr-3 flex items-center justify-center text-white font-bold">P</div>
                    <span className="text-xl font-bold text-gray-800 tracking-tight">PCARDB Sys</span>
                </div>

                <nav className="flex-1 p-4 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">Menu</div>
                    <NavItem to="/" icon={<Home size={20} />} label={t('dashboard')} />
                    <NavItem to="/select-scheme" icon={<FilePlus size={20} />} label={t('newApplication')} />
                    {role === 'manager' && (
                        <NavItem to="/applications" icon={<Database size={20} />} label={t('allApplications')} />
                    )}
                </nav>

                <div className="p-4 border-t bg-gray-50">
                    {/* Language Toggle */}
                    <button onClick={toggleLanguage} className="flex items-center w-full px-4 py-2 mb-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                        <Languages size={16} className="mr-2" />
                        {language === 'en' ? 'ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ' : 'Switch to English'}
                    </button>

                    <div className="flex items-center mb-4 px-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {role ? role[0].toUpperCase() : 'U'}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-700 capitalize">{role || 'User'}</p>
                            <p className="text-xs text-gray-500">Active Session</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition">
                        <LogOut size={16} className="mr-2" />
                        {t('logout')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto flex flex-col">
                <header className="flex items-center justify-between px-8 py-5 bg-white border-b shadow-sm sticky top-0 z-10 md:hidden">
                    <div className="font-bold text-lg text-blue-600">PCARDB</div>
                    <button className="p-1 rounded hover:bg-gray-100"><Menu /></button>
                </header>

                <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
