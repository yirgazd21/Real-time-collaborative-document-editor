import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const data = await authService.getCurrentUser();
          setUser(data.user);
        } catch (err) {
          console.error("Auth initialization failed:", err);
          localStorage.removeItem("accessToken");
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    setError(null);
    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const data = await authService.register(userData);
      setUser(data.user);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setError(msg);
      throw new Error(msg);
    }
  };

  const googleAuth = async (idToken) => {
    setError(null);
    try {
      const data = await authService.googleAuth(idToken);
      setUser(data.user);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Google Authentication failed";
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        googleAuth,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
