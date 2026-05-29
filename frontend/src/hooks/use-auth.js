import { useState, useEffect, useContext, createContext } from "react";
import { authApi } from "../lib/api";
import { connectSocket, emitSetup, disconnectSocket } from "../lib/socket";
import socket from "../lib/socket";

export const useAuthProvider = () => {
  const [user, setUser] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  /**
   * Fix #13: Wait for the socket "connect" event before emitting "setup".
   * If the socket is already connected (e.g. reconnect), emit immediately.
   * This prevents setup being lost in the void before the handshake completes.
   */
  const _emitSetupWhenReady = () => {
    if (socket.connected) {
      emitSetup();
    } else {
      socket.once("connect", () => emitSetup());
    }
  };

  /**
   * Shared post-login logic:
   *   1. Store token
   *   2. Set user state (from server response or fetch /me)
   *   3. Connect socket + emit setup
   */
  const _postLogin = async (token, userData) => {
    localStorage.setItem("auth-token", token);

    if (userData) {
      setUser(userData);
    } else {
      const me = await authApi.getMe();
      setUser(me);
    }

    connectSocket(token);
    _emitSetupWhenReady();
  };

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    await _postLogin(data.authtoken, data.user);
  };

  const loginWithOtp = async (email, otp) => {
    const data = await authApi.login({ email, otp });
    await _postLogin(data.authtoken, data.user);
  };

  /**
   * Fix #12: pass data.user from register response instead of
   * always making an extra /me call after registration.
   */
  const register = async (name, email, password) => {
    const data = await authApi.register({ name, email, password });
    await _postLogin(data.authtoken, data.user);
  };

  /**
   * Fix #14: logout clears state and disconnects socket.
   * Navigation is still handled by each call-site because the hook
   * doesn't have access to the router — but this is documented clearly.
   * Components should call: logout(); navigate("/login");
   */
  const logout = () => {
    localStorage.removeItem("auth-token");
    disconnectSocket();
    setUser(null);
  };

  // Bootstrap: re-authenticate on page refresh
  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem("auth-token");

      if (!token) {
        setIsUserLoading(false);
        return;
      }

      try {
        const me = await authApi.getMe();
        setUser(me);

        connectSocket(token);
        _emitSetupWhenReady();
      } catch {
        // Token invalid or expired — clear it so the user sees the login screen
        localStorage.removeItem("auth-token");
      } finally {
        setIsUserLoading(false);
      }
    };

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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