import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { register, handleSubmit, setError, formState: { errors } } = useForm();
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
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600">
            <div className="p-8 bg-white rounded-xl shadow-2xl w-96 transform transition-all hover:scale-105">
                <h2 className="mb-2 text-3xl font-bold text-center text-gray-800">Welcome Back</h2>
                <p className="mb-6 text-center text-gray-500 text-sm">Sign in to PCARDB Loan System</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Username</label>
                        <input
                            {...register('username', { required: 'Username is required' })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            placeholder="e.g. manager"
                        />
                        {errors.username && <p className="mt-1 text-red-500 text-xs">{errors.username.message}</p>}
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            {...register('password', { required: 'Password is required' })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            placeholder="••••••••"
                        />
                        {errors.password && <p className="mt-1 text-red-500 text-xs">{errors.password.message}</p>}
                    </div>
                    {errors.root && <div className="p-2 text-red-700 bg-red-100 rounded text-sm text-center">{errors.root.message}</div>}

                    <button type="submit" className="w-full py-2.5 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition shadow-lg">
                        Sign In
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <Link to="/signup" className="text-sm text-blue-600 hover:underline">Create an Account</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
