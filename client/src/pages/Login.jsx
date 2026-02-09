import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineMail, HiOutlineLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';
import logo from '../assets/TalkNest1.png';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Backend API call for Login
            const { data } = await axios.post('http://localhost:4000/api/auth/login', formData);
            
            // Storing session data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            toast.success("Welcome back to the Nest! 🚀");
            
            // Redirect to Home/Dashboard
            setTimeout(() => navigate('/home'), 1500);

        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
            <Toaster position="top-center" />
            
            {/* Soft Glow Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />

            <div className="relative z-10 w-full max-w-md p-[1px] bg-gradient-to-br from-white/20 to-transparent rounded-3xl backdrop-blur-xl shadow-2xl mx-4">
                <div className="bg-[#1e293b]/95 p-8 md:p-10 rounded-3xl border border-white/10">
                    <div className="text-center mb-8">
                        <img src={logo} alt="TalkNest" className="h-16 mx-auto mb-4 hover:scale-110 transition-transform duration-300" />
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome Back</h2>
                        <p className="text-slate-400 mt-2">Enter your credentials to access TalkNest</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Identifier Field (Email or Phone) */}
                        <div className="relative group">
                            <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl group-focus-within:text-teal-400 transition-colors" />
                            <input 
                                name="identifier" 
                                type="text" 
                                placeholder="Email or Phone Number" 
                                onChange={handleChange}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-2xl text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none transition-all placeholder:text-slate-500"
                                required 
                            />
                        </div>

                        {/* Password Field */}
                        <div className="relative group">
                            <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl group-focus-within:text-purple-400 transition-colors" />
                            <input 
                                name="password" 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Password" 
                                onChange={handleChange}
                                className="w-full pl-12 pr-12 py-3.5 bg-slate-800/50 border border-slate-700 rounded-2xl text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all placeholder:text-slate-500"
                                required 
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                            </button>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="flex justify-end">
                            <Link to="/forgot-password" title="Reset Password" className="text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors">
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Sign In Button */}
                        <button 
                            disabled={loading} 
                            className="w-full py-4 bg-gradient-to-r from-teal-500 to-purple-600 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? "Verifying..." : "Sign In"}
                        </button>
                    </form>

                    {/* Registration Link */}
                    <p className="mt-8 text-center text-slate-400 text-sm">
                        Don't have an account? <Link to="/register" className="text-teal-400 font-bold hover:text-teal-300 transition-colors ml-1">Register Now</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;