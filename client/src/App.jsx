import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login'; // Path check kar lena
import Register from './pages/Register';

function App() {
  return (
    <Router>
      <div className="font-sans antialiased text-slate-900">
        <Routes>
          {/* Default route Login par rakha hai */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
                onClick={() => window.location.href = '/login'}
                className="mt-8 px-6 py-2 border-2 border-teal-500 text-teal-600 font-bold rounded-full hover:bg-teal-500 hover:text-white transition-all"
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