import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForgetPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSendResetLink = async (e) => {
        e.preventDefault();
        
        if (!email) {
            setMessage('Please enter your email');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Reset link sent to your email!');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setMessage(data.message || 'Error sending reset link');
            }
        } catch (error) {
            setMessage('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forget-password-container">
            <div className="forget-password-box">
                <h2>Forgot Password</h2>
                <form onSubmit={handleSendResetLink}>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>
                {message && <p className="message">{message}</p>}
            </div>
        </div>
    );
}