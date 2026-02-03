import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/TalkNest1.png';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '', // Phone number added
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords don't match!");
            return;
        }
        try {
            // Backend endpoint ko data bhejna
            await axios.post('http://localhost:5000/api/auth/register', formData);
            alert("Registration Successful! Please login.");
            navigate('/login');
        } catch (err) {
            alert(err.response?.data?.message || "Registration failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="bg-white p-10 rounded-[2rem] shadow-2xl w-full max-w-lg border border-slate-100">
                <div className="flex flex-col items-center mb-6">
                    <img src={logo} alt="TalkNest" className="h-20 mb-2" />
                    <h2 className="text-3xl font-bold text-slate-800">Join TalkNest</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="name" type="text" placeholder="Full Name" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 outline-none transition-all" required />
                    <input name="email" type="email" placeholder="Email Address" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 outline-none transition-all" required />
                    <input name="phone" type="tel" placeholder="Phone Number (e.g. 9876543210)" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-400 outline-none transition-all" required />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <input name="password" type="password" placeholder="Password" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-400 outline-none transition-all" required />
                        <input name="confirmPassword" type="password" placeholder="Confirm" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-400 outline-none transition-all" required />
                    </div>

                    <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-500 to-purple-600 text-white font-bold text-lg hover:scale-[1.02] transition-transform">
                        Create Account
                    </button>
                </form>

                <p className="mt-6 text-center text-slate-500">
                    Already a member? <span onClick={() => navigate('/login')} className="text-purple-600 font-bold cursor-pointer hover:underline">Sign In</span>
                </p>
            </div>
        </div>
    );
};

export default Register;