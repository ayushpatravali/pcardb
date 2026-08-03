import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Landmark } from 'lucide-react';
import { registerUser } from '../services/api';

const inputCls = "w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100";

const SignUp = () => {
    const { register, handleSubmit, setError, formState: { errors } } = useForm();
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        try {
            await registerUser(data);
            alert("Registration Successful! Please login.");
            navigate('/login');
        } catch (err) {
            setError('root', { message: err.response?.data?.detail || 'Registration failed' });
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-surface p-6">
            <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
                className="w-full max-w-md"
            >
                <div className="mb-8 flex items-center justify-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-800 text-accent-300">
                        <Landmark size={22} />
                    </div>
                    <div>
                        <p className="font-bold leading-tight text-stone-900">PCARD Bank · Gokak</p>
                        <p className="text-xs text-stone-500">ಸಾಲ ಅರ್ಜಿ ವ್ಯವಸ್ಥೆ</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-card">
                    <h2 className="text-2xl font-bold tracking-tight text-stone-900">Create Account</h2>
                    <p className="mt-1 mb-6 text-sm text-stone-500">New operator account for this branch</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-stone-700">Full Name</label>
                            <input {...register('full_name', { required: 'Name is required' })} className={inputCls} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-stone-700">Username</label>
                            <input {...register('username', { required: 'Username is required' })} className={inputCls} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-stone-700">Password</label>
                            <input
                                type="password"
                                {...register('password', { required: 'Password is required', minLength: { value: 4, message: "Min 4 chars" } })}
                                className={inputCls}
                            />
                            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-stone-700">Role</label>
                                <select {...register('role')} className={inputCls}>
                                    <option value="field_officer">Field Officer</option>
                                    <option value="manager">Manager</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-stone-700">ವಲಯ — Region</label>
                                <input {...register('region')} defaultValue="ಗೋಕಾಕ" className={inputCls} />
                            </div>
                        </div>

                        {errors.root && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                                {errors.root.message}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="mt-2 w-full rounded-xl bg-primary-700 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-300"
                        >
                            Register
                        </button>
                    </form>
                    <div className="mt-5 text-center">
                        <Link to="/login" className="text-sm font-medium text-primary-700 hover:text-primary-800 hover:underline">
                            Already have an account? Login
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SignUp;
