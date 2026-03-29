import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import {
  MessageCircleIcon,
  LockIcon,
  MailIcon,
  UserIcon,
  PhoneIcon,
  LoaderIcon,
} from 'lucide-react';

function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const { signup, isSigningUp } = useAuthStore();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      alert('Please fill all fields');
      return;
    }

    try {
      await signup(formData);
      alert('Account created successfully. Please login.');
      navigate('/login');
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
                    Create Account
                  </h2>
                  <p className="text-slate-400">
                    Sign up to start chatting
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* NAME */}
                  <div>
                    <label className="auth-input-label">Name</label>
                    <div className="relative">
                      <UserIcon className="auth-input-icon" />

                      <input
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        className="input"
                        required
                      />
                    </div>
                  </div>

                  {/* EMAIL */}
                  <div>
                    <label className="auth-input-label">Email</label>

                    <div className="relative">
                      <MailIcon className="auth-input-icon" />

                      <input
                        name="email"
                        type="email"
                        placeholder="johndoe@gmail.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="input"
                        required
                      />
                    </div>
                  </div>

                  {/* PHONE */}
                  <div>
                    <label className="auth-input-label">Phone Number</label>

                    <div className="relative">
                      <PhoneIcon className="auth-input-icon" />

                      <input
                        name="phone"
                        type="tel"
                        placeholder="+91 9876543210"
                        value={formData.phone}
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

                  {/* BUTTON */}
                  <button
                    type="submit"
                    disabled={isSigningUp}
                    className="auth-btn"
                  >
                    {isSigningUp ? (
                      <LoaderIcon className="w-full h-5 animate-spin" />
                    ) : (
                      "Create Account"
                    )}
                  </button>

                </form>

                <div className="mt-6 text-center">
                  <Link to="/login" className="auth-link">
                    Already have an account? Login
                  </Link>
                </div>

              </div>

            </div>

            {/* RIGHT IMAGE */}
            <div className="hidden md:w-1/2 md:flex items-center justify-center p-6 bg-gradient-to-bl from-slate-800/20 to-transparent">

              <div>
                <img
                  src="/signup.png"
                  alt="Signup Illustration"
                  className="w-full object-contain"
                />

                <div className="mt-6 text-center">
                  <h3 className="text-xl font-medium text-cyan-400">
                    Start your journey today
                  </h3>

                  <div className="mt-4 flex justify-center gap-4">
                    <span className="auth-badge">Free</span>
                    <span className="auth-badge">Secure</span>
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

export default SignUpPage;