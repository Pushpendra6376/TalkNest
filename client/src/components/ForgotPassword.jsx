import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineMail, HiArrowLeft } from 'react-icons/hi';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('http://localhost:4000/api/auth/forgot-password', { email });
            toast.success("Reset link sent to your email!");
        } catch (err) {
            toast.error("User not found or error sending email.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
            <Toaster />
            <div className="bg-[#1e293b] p-8 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl">
                <Link to="/login" className="flex items-center text-slate-400 hover:text-white mb-6 text-sm">
                    <HiArrowLeft className="mr-2" /> Back to Login
                </Link>
                
                <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-slate-400 text-sm mb-6">Don't worry! It happens. Enter your email linked to your account.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <HiOutlineMail className="absolute left-4 top-4 text-slate-500 text-xl" />
                        <input 
                            type="email" 
                            placeholder="Enter your email" 
                            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:border-purple-400 outline-none"
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                    </div>
                    <button disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all">
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;