import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineLockClosed } from 'react-icons/hi';
import logo from '../assets/TalkNest1.png';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data } = await axios.post(
                'http://localhost:4000/api/auth/register',
                formData
            );

            // 🔒 If backend returns token → auto login
            if (data?.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                toast.success("Welcome to TalkNest 🚀");
                navigate("/home", { replace: true });
                return;
            }

            // 🟡 If backend does NOT return token
            toast.success("Registration successful! Please login.");
            navigate("/login", { replace: true });

        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                "Registration failed. Try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
            <Toaster position="top-center" />

            {/* Glow */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-600/10 rounded-full blur-[120px]" />

            <div className="relative z-10 w-full max-w-lg p-[1px] bg-gradient-to-br from-white/20 to-transparent rounded-3xl backdrop-blur-xl shadow-2xl mx-4">
                <div className="bg-[#1e293b]/95 p-8 md:p-10 rounded-3xl border border-white/10">

                    <div className="text-center mb-8">
                        <img src={logo} alt="TalkNest" className="h-14 mx-auto mb-4" />
                        <h2 className="text-3xl font-extrabold text-white">
                            Create Account
                        </h2>
                        <p className="text-slate-400 mt-2">
                            Join the TalkNest community today
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Name */}
                        <div className="relative">
                            <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl" />
                            <input
                                name="name"
                                placeholder="Full Name"
                                onChange={handleChange}
                                required
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-2xl text-white"
                            />
                        </div>

                        {/* Email & Phone */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl" />
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="Email"
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-2xl text-white"
                                />
                            </div>

                            <div className="relative">
                                <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl" />
                                <input
                                    name="phone"
                                    type="tel"
                                    placeholder="Phone"
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-2xl text-white"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl" />
                            <input
                                name="password"
                                type="password"
                                placeholder="Create Password"
                                onChange={handleChange}
                                required
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-2xl text-white"
                            />
                        </div>

                        <button
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-teal-500 to-purple-600 text-white font-bold rounded-2xl disabled:opacity-50 mt-4"
                        >
                            {loading ? "Processing..." : "Create Account"}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-slate-400 text-sm">
                        Already have an account?
                        <Link to="/login" className="text-teal-400 font-bold ml-1">
                            Login
                        </Link>
                    </p>

                </div>
            </div>
        </div>
    );
};

export default Register;
