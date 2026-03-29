import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import {
  MessageCircleIcon,
  MailIcon,
  LockIcon,
  LoaderIcon,
} from 'lucide-react';

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
  });

  const { login, isLoggingIn } = useAuthStore();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.emailOrPhone || !formData.password) {
      alert('Please fill all fields');
      return;
    }

    try {
      await login(formData);
      navigate('/chat');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-4 bg-slate-900">
      <div className="relative w-full max-w-6xl md:h-[800px] h-[650px]">

        <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-950/20 shadow-xl shadow-slate-900/20">

          <div className="w-full flex flex-col md:flex-row">

            {/* LEFT FORM */}
            <div className="md:w-1/2 p-8 flex items-center justify-center md:border-r border-slate-600/30">

              <div className="w-full max-w-md">

                <div className="text-center mb-8">
                  <MessageCircleIcon className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h2 className="text-2xl font-bold text-slate-200 mb-2">
                    Welcome Back
                  </h2>
                  <p className="text-slate-400">
                    Login to continue chatting
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* EMAIL OR PHONE */}
                  <div>
                    <label className="auth-input-label">
                      Email or Phone
                    </label>

                    <div className="relative">
                      <MailIcon className="auth-input-icon" />

                      <input
                        name="emailOrPhone"
                        type="text"
                        placeholder="Enter email or phone"
                        value={formData.emailOrPhone}
                        onChange={handleChange}
                        className="input"
                        required
                      />
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <label className="auth-input-label">Password</label>

                    <div className="relative">
                      <LockIcon className="auth-input-icon" />

                      <input
                        name="password"
                        type="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={handleChange}
                        className="input"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="auth-btn"
                  >
                    {isLoggingIn ? (
                      <LoaderIcon className="w-full h-5 animate-spin" />
                    ) : (
                      "Sign In"
                    )}
                  </button>

                </form>

                <div className="mt-6 text-center">
                  <Link to="/signup" className="auth-link">
                    Don't have an account? Sign Up
                  </Link>
                </div>

              </div>

            </div>

            {/* RIGHT IMAGE */}
            <div className="hidden md:w-1/2 md:flex items-center justify-center p-6 bg-gradient-to-bl from-slate-800/20 to-transparent">

              <div>
                <img
                  src="/login.png"
                  alt="Login Illustration"
                  className="w-full object-contain"
                />

                <div className="mt-6 text-center">
                  <h3 className="text-xl font-medium text-cyan-400">
                    Connect Anytime Anywhere
                  </h3>

                  <div className="mt-4 flex justify-center gap-4">
                    <span className="auth-badge">Secure</span>
                    <span className="auth-badge">Private</span>
                    <span className="auth-badge">Fast</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default LoginPage;