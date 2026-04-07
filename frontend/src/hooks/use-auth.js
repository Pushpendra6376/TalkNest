import { useState, useEffect, useContext, createContext } from "react";
import { authApi } from "../lib/api";
import { connectSocket, emitSetup, disconnectSocket } from "../lib/socket";

export const useAuthProvider = () => {
  const [user, setUser] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const _postLogin = async (token, userData) => {
    localStorage.setItem("auth-token", token);

    if (userData) {
      setUser(userData);
    } else {
      const me = await authApi.getMe();
      setUser(me);
    }

    connectSocket(token);
    emitSetup();
  };

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    await _postLogin(data.authtoken, data.user);
  };

  const loginWithOtp = async (email, otp) => {
    const data = await authApi.login({ email, otp });
    await _postLogin(data.authtoken, data.user);
  };

  const register = async (name, email, password) => {
    const data = await authApi.register({ name, email, password });
    await _postLogin(data.authtoken);
  };

  const logout = () => {
    localStorage.removeItem("auth-token");
    disconnectSocket();
    setUser(null);
  };

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem("auth-token");

      if (!token) {
        setIsUserLoading(false);
        return;
      }

      try {
        const user = await authApi.getMe();
        setUser(user);

        connectSocket(token);
        emitSetup();
      } catch (err) {
        localStorage.removeItem("auth-token");
      } finally {
        setIsUserLoading(false);
      }
    };

    bootstrap();
  }, []);

  return {
    user,
    setUser,
    isUserLoading,
    login,
    loginWithOtp,
    register,
    logout,
  };
};

/* ─── context ───────────────────────────────────────── */

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};