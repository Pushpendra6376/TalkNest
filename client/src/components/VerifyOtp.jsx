import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const VerifyOtp = () => {
    const { state } = useLocation(); // Register page se email le raha hai
    const navigate = useNavigate();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Backend endpoint jo humne banaya tha
            await axios.post('http://localhost:4000/api/auth/verify-otp', {
                identifier: state?.email || state?.phone, // Use email from state
                otp
            });
            toast.success("Verification Successful! Login now.");
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            toast.error("Invalid OTP or expired.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
            <Toaster />
            <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-700 w-full max-w-sm text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Verify Account</h2>
                <p className="text-slate-400 text-sm mb-6">Enter the OTP sent to {state?.email}</p>
                
                <form onSubmit={handleVerify} className="space-y-4">
                    <input 
                        type="text" 
                        maxLength="6"
                        placeholder="Enter 6-digit OTP"
                        className="w-full text-center text-2xl tracking-widest py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:border-teal-400 outline-none"
                        onChange={(e) => setOtp(e.target.value)}
                    />
                    <button disabled={loading} className="w-full py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600">
                        {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VerifyOtp;