import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';

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
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600">
            <div className="p-8 bg-white rounded-xl shadow-2xl w-96 transform transition-all hover:scale-105">
                <h2 className="mb-2 text-3xl font-bold text-center text-gray-800">Create Account</h2>
                <p className="mb-6 text-center text-gray-500 text-sm">Join PCARDB Loan System</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            {...register('full_name', { required: 'Name is required' })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Username</label>
                        <input
                            {...register('username', { required: 'Username is required' })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            {...register('password', { required: 'Password is required', minLength: { value: 4, message: "Min 4 chars" } })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Role</label>
                        <select {...register('role')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="field_officer">Field Officer</option>
                            <option value="manager">Manager</option>
                        </select>
                    </div>

                    {errors.root && <div className="p-2 text-red-700 bg-red-100 rounded text-sm text-center">{errors.root.message}</div>}

                    <button type="submit" className="w-full py-2.5 text-white bg-green-600 rounded-lg font-semibold hover:bg-green-700 transition shadow-lg mt-2">
                        Register
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <Link to="/login" className="text-sm text-blue-600 hover:underline">Already have an account? Login</Link>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
