import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineLockClosed } from 'react-icons/hi';
import logo from '../assets/TalkNest1.png';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('http://localhost:4000/api/auth/register', formData);
            toast.success("Account created! Sending OTP...");
            
            // Redirect to OTP page and pass email/phone for verification
            setTimeout(() => {
                navigate('/verify-otp', { state: { email: formData.email, phone: formData.phone } });
            }, 1000);
        } catch (err) {
            toast.error(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
            <Toaster position="top-center" />
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />

            <div className="relative z-10 w-full max-w-lg p-[1px] bg-gradient-to-br from-white/10 to-transparent rounded-3xl backdrop-blur-xl shadow-2xl">
                <div className="bg-[#1e293b]/90 p-8 rounded-3xl border border-white/10">
                    <div className="text-center mb-6">
                        <img src={logo} alt="TalkNest" className="h-14 mx-auto mb-2" />
                        <h2 className="text-3xl font-bold text-white">Join TalkNest</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <HiOutlineUser className="absolute left-4 top-4 text-slate-500 text-xl" />
                            <input name="name" type="text" placeholder="Full Name" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:border-teal-400 outline-none" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <HiOutlineMail className="absolute left-4 top-4 text-slate-500 text-xl" />
                                <input name="email" type="email" placeholder="Email" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:border-teal-400 outline-none" required />
                            </div>
                            <div className="relative">
                                <HiOutlinePhone className="absolute left-4 top-4 text-slate-500 text-xl" />
                                <input name="phone" type="tel" placeholder="Phone" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:border-teal-400 outline-none" required />
                            </div>
                        </div>
                        <div className="relative">
                            <HiOutlineLockClosed className="absolute left-4 top-4 text-slate-500 text-xl" />
                            <input name="password" type="password" placeholder="Password" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:border-purple-400 outline-none" required />
                        </div>

                        <button disabled={loading} className="w-full py-3 bg-gradient-to-r from-teal-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 disabled:opacity-50">
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-slate-400 text-sm">
                        Already have an account? <Link to="/login" className="text-teal-400 font-bold hover:underline">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;