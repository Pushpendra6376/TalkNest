import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineMail, HiArrowLeft } from 'react-icons/hi';
import logo from '../assets/TalkNest1.png'; // Logo add kiya hai consistency ke liye

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('http://localhost:4000/api/auth/forgot-password', { email });
            toast.success("Reset link sent! Check your inbox 📧");
        } catch (err) {
            toast.error(err.response?.data?.message || "User not found or connection error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
            <Toaster position="top-center" />
            
            {/* Background Effects matching Login/Register */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-600/10 rounded-full blur-[120px]" />

            <div className="relative z-10 w-full max-w-md p-[1px] bg-gradient-to-br from-white/20 to-transparent rounded-3xl backdrop-blur-xl shadow-2xl mx-4">
                <div className="bg-[#1e293b]/95 p-8 md:p-10 rounded-3xl border border-white/10 text-center">
                    
                    {/* Back Navigation */}
                    <div className="flex justify-start mb-6">
                        <Link to="/login" className="flex items-center text-slate-400 hover:text-teal-400 transition-colors text-sm font-medium">
                            <HiArrowLeft className="mr-2" /> Back to Login
                        </Link>
                    </div>

                    <img src={logo} alt="TalkNest" className="h-14 mx-auto mb-4" />
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Reset Password</h2>
                    <p className="text-slate-400 mt-2 mb-8 text-sm">
                        Don't worry! Enter the email associated with your account and we'll send you a recovery link.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative group text-left">
                            <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl group-focus-within:text-purple-400 transition-colors" />
                            <input 
                                type="email" 
                                placeholder="Enter your registered email" 
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-2xl text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all placeholder:text-slate-500"
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </div>

                        <button 
                            disabled={loading} 
                            className="w-full py-4 bg-gradient-to-r from-teal-500 to-purple-600 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Sending link..." : "Send Reset Link"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;