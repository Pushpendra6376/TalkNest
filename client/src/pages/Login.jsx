import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
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
            const { data } = await axios.post('http://localhost:4000/api/auth/login', formData);
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            toast.success("Welcome back to the Nest! 🚀");
            setTimeout(() => navigate('/home'), 1500);

        } catch (err) {
            toast.error(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
            <Toaster position="top-center" />
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />

            <div className="relative z-10 w-full max-w-md p-[1px] bg-gradient-to-br from-white/10 to-transparent rounded-3xl backdrop-blur-xl shadow-2xl">
                <div className="bg-[#1e293b]/90 p-8 rounded-3xl border border-white/10">
                    <div className="text-center mb-8">
                        <img src={logo} alt="TalkNest" className="h-16 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
                        <p className="text-slate-400 text-sm">Enter your credentials to access your account.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <HiOutlineMail className="absolute left-4 top-4 text-slate-500 text-xl" />
                            <input 
                                name="identifier" 
                                type="text" 
                                placeholder="Email or Phone Number" 
                                onChange={handleChange}
                                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none transition-all"
                                required 
                            />
                        </div>

                        <div className="relative">
                            <HiOutlineLockClosed className="absolute left-4 top-4 text-slate-500 text-xl" />
                            <input 
                                name="password" 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Password" 
                                onChange={handleChange}
                                className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all"
                                required 
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-4 text-slate-400 hover:text-white"
                            >
                                {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                            </button>
                        </div>

                        <div className="flex justify-end">
                            <Link to="/forgot-password" class="text-xs text-purple-400 hover:text-purple-300 font-medium">
                                Forgot Password?
                            </Link>
                        </div>

                        <button disabled={loading} className="w-full py-3 bg-gradient-to-r from-teal-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all disabled:opacity-50">
                            {loading ? "Signing In..." : "Sign In"}
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-4">
                        <div className="h-[1px] bg-slate-700 flex-1" />
                        <span className="text-slate-500 text-xs uppercase font-bold">Or continue with</span>
                        <div className="h-[1px] bg-slate-700 flex-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 py-2 bg-white rounded-lg hover:bg-slate-100 transition-colors">
                            <FcGoogle size={20} /> <span className="text-slate-800 font-bold text-sm">Google</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 py-2 bg-[#1877F2] rounded-lg hover:bg-[#166fe5] transition-colors">
                            <FaFacebook size={20} className="text-white" /> <span className="text-white font-bold text-sm">Facebook</span>
                        </button>
                    </div>

                    <p className="mt-6 text-center text-slate-400 text-sm">
                        Don't have an account? <Link to="/register" className="text-teal-400 font-bold hover:underline">Register</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;