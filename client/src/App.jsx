import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages Import
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './components/ForgotPassword'; // New Import

function App() {
  return (
    <Router>
      <div className="font-sans antialiased text-slate-900 bg-[#0f172a] min-h-screen">
        <Routes>
          {/* Default route redirects to Login */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} /> {/* New Route */}

          {/* Home/Dashboard Page */}
          <Route path="/home" element={
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
              <div className="animate-bounce mb-6">
                <span className="text-6xl">🚀</span>
              </div>
              <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-purple-600">
                TalkNest is Ready
              </h1>
              <p className="mt-4 text-slate-500 font-medium tracking-wide">
                Your professional communication hub is live.
              </p>
              <button 
                onClick={() => {
                  localStorage.removeItem('token'); // Logout par token clear karna achi practice hai
                  localStorage.removeItem('user');
                  window.location.href = '/login';
                }}
                className="mt-8 px-8 py-3 border-2 border-teal-500 text-teal-600 font-bold rounded-full hover:bg-teal-500 hover:text-white transition-all shadow-lg"
              >
                Logout
              </button>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;