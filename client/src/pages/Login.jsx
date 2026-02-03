import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/TalkNest1.png';

const Login = () => {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState(''); // Email or Phone
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Identifier check karega ki input email hai ya phone
            const response = await axios.post('http://localhost:5000/api/auth/login', { 
                identifier, 
                password 
            });
            
            // Token save karna (Recruiter likes seeing good token management)
            localStorage.setItem('token', response.data.token);
            navigate('/home'); 
        } catch (err) {
            alert(err.response?.data?.message || "Login failed. Check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
            {/* Background Blobs for Modern UI */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute bottom-0 -right-4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md z-10 border border-slate-100 relative">
                <div className="flex flex-col items-center mb-8">
                    <img src={logo} alt="TalkNest" className="h-24 w-auto mb-4 hover:scale-105 transition-transform duration-300" />
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Welcome Back</h2>
                    <p className="text-slate-500 mt-2 text-center text-sm font-medium">Log in to your nest and start chatting.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Email or Phone Number</label>
                        <input 
                            type="text" 
                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-400 outline-none transition-all bg-slate-50/50"
                            placeholder="e.g. pushpendra@mail.com or 6376547126"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2 ml-1">
                            <label className="text-sm font-bold text-slate-700">Password</label>
                            <span className="text-xs font-bold text-purple-600 cursor-pointer hover:underline">Forgot?</span>
                        </div>
                        <input 
                            type="password" 
                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-purple-400 outline-none transition-all bg-slate-50/50"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-purple-600 text-white font-black text-lg shadow-xl transition-all active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 shadow-teal-200/50'}`}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm font-medium">
                        New to TalkNest? 
                        <span 
                            onClick={() => navigate('/register')} 
                            className="ml-2 text-teal-600 font-extrabold cursor-pointer hover:underline"
                        >
                            Create Account
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;