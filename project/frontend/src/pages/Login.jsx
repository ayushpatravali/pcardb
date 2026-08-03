import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Landmark, User, KeyRound, ShieldCheck, FileText, Printer, Calculator, Tractor } from 'lucide-react';
import { login as apiLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Feature = ({ icon, text }) => (
    <li className="flex items-center gap-3 text-primary-100/90 text-sm">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-accent-300">
            {icon}
        </span>
        {text}
    </li>
);

const Login = () => {
    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm();
    const navigate = useNavigate();
    const { login } = useAuth();

    const onSubmit = async (data) => {
        try {
            const response = await apiLogin(data.username, data.password);
            // Update Context
            login({
                token: response.access_token,
                role: response.role,
                username: data.username
            });
            navigate('/');
        } catch (err) {
            setError('root', { message: 'Invalid credentials' });
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-surface">
            {/* Brand panel */}
            <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-primary-950 p-12 text-white">
                <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '26px 26px' }} />
                <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary-700/40 blur-3xl" />

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-400 text-primary-950 shadow-lg">
                            <Landmark size={28} />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-accent-300 font-semibold">PCARD Bank · Gokak</p>
                            <p className="text-lg font-bold">ಸಾಲ ಅರ್ಜಿ ವ್ಯವಸ್ಥೆ</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
                    <h1 className="text-3xl xl:text-4xl font-bold leading-snug tracking-tight">
                        ದಿ ಗೋಕಾಕ ತಾಲೂಕಾ ಪ್ರಾಥಮಿಕ ಸಹಕಾರಿ ಕೃಷಿ ಮತ್ತು ಗ್ರಾಮೀಣ ಅಭಿವೃದ್ಧಿ ಬ್ಯಾಂಕ ನಿ.
                    </h1>
                    <p className="mt-3 text-primary-200">
                        Gokak Taluka Primary Co-operative Agriculture &amp; Rural Development Bank Ltd.
                    </p>

                    <ul className="mt-10 space-y-4">
                        <Feature icon={<FileText size={16} />} text="ಸಾಲದ ಅರ್ಜಿಗಳ ಡಿಜಿಟಲ್ ದಾಖಲಾತಿ" />
                        <Feature icon={<Printer size={16} />} text="ಮುದ್ರಣ ಸಿದ್ಧ ಕನ್ನಡ ಅರ್ಜಿ ಪ್ಯಾಕೆಟ್ — ನೇರವಾಗಿ ಪ್ರಿಂಟ್ ಮಾಡಿ" />
                        <Feature icon={<Calculator size={16} />} text="ಸ್ವಯಂಚಾಲಿತ ಲೆಕ್ಕಾಚಾರ — ಬೆಳೆ ಆದಾಯ, ಜಮೀನಿನ ಮೌಲ್ಯ, ಸಾಲದ ಕಂತು" />
                        <Feature icon={<Tractor size={16} />} text="ಟ್ರ್ಯಾಕ್ಟರ್ · ಕುರಿ ಸಾಕಾಣಿಕೆ · ಎತ್ತು-ಬಂಡಿ · ಭೂ ಅಭಿವೃದ್ಧಿ ಯೋಜನೆಗಳು" />
                        <Feature icon={<ShieldCheck size={16} />} text="ಬ್ಯಾಂಕ್ ಒಳಜಾಲದಲ್ಲಿ ಮಾತ್ರ — ಸುರಕ್ಷಿತ ದತ್ತಾಂಶ" />
                    </ul>
                </motion.div>

                <p className="text-xs text-primary-300/70">
                    ಜಿಲ್ಲಾ : ಬೆಳಗಾವಿ &nbsp;·&nbsp; ಕರ್ನಾಟಕ
                </p>
            </div>

            {/* Form panel */}
            <div className="flex items-center justify-center p-6 sm:p-12">
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
                    className="w-full max-w-md"
                >
                    {/* Small-screen brand header */}
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-800 text-accent-300">
                            <Landmark size={22} />
                        </div>
                        <div>
                            <p className="font-bold text-stone-900 leading-tight">PCARD Bank · Gokak</p>
                            <p className="text-xs text-stone-500">ಸಾಲ ಅರ್ಜಿ ವ್ಯವಸ್ಥೆ</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-card">
                        <h2 className="text-2xl font-bold tracking-tight text-stone-900">ಪ್ರವೇಶ — Sign in</h2>
                        <p className="mt-1 mb-7 text-sm text-stone-500">Use your operator account to continue</p>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-stone-700">Username</label>
                                <div className="relative">
                                    <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input
                                        {...register('username', { required: 'Username is required' })}
                                        className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                                        placeholder="e.g. manager"
                                        autoComplete="username"
                                    />
                                </div>
                                {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-stone-700">Password</label>
                                <div className="relative">
                                    <KeyRound size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input
                                        type="password"
                                        {...register('password', { required: 'Password is required' })}
                                        className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                </div>
                                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                            </div>

                            {errors.root && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                                    {errors.root.message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-xl bg-primary-700 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-60"
                            >
                                {isSubmitting ? 'Signing in…' : 'Sign In'}
                            </button>
                        </form>

                        <div className="mt-5 text-center">
                            <Link to="/signup" className="text-sm font-medium text-primary-700 hover:text-primary-800 hover:underline">
                                Create an Account
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
