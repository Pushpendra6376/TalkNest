import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./components/ForgotPassword";
import ChatPage from "./pages/ChatPage";

// Simple auth check
const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

function App() {
  return (
    <Router>
      <div className="font-sans antialiased text-slate-900 bg-[#0f172a] min-h-screen">
        <Routes>
          {/* Default */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Chat Route */}
          <Route
            path="/home"
            element={
              isAuthenticated() ? <ChatPage /> : <Navigate to="/login" />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
