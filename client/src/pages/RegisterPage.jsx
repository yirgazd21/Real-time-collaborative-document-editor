import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { GoogleAuthButton } from "../features/auth/GoogleAuthButton";
import { Button } from "../components/common/Button";
import { FileText, User, Mail, Lock, AlertCircle, CheckCircle2, Sun, Moon } from "lucide-react";

export const RegisterPage = () => {
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await register(formData);
      navigate("/");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Password Strength Indicators
  const pwd = formData.password;
  const pwdChecks = {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[!@#$%^&*]/.test(pwd),
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-colors relative">
      {/* Theme Toggle Button Top-Right */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-xl glass-panel text-slate-300 hover:text-amber-400 transition-colors"
        title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600" />
        )}
      </button>

      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 mx-auto mb-4">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 bg-clip-text text-transparent">
            Create Your Account
          </h1>
          <p className="text-sm opacity-70 mt-2">
            Start collaborating seamlessly on SyncWrite
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl border border-slate-700/50">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 opacity-50" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Alex Mercer"
                  className="w-full glass-panel rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 opacity-50" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex@company.com"
                  className="w-full glass-panel rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 opacity-50" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full glass-panel rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              {/* Password Requirement hints */}
              {pwd.length > 0 && (
                <div className="mt-3 p-3 glass-panel rounded-xl text-xs grid grid-cols-2 gap-1.5">
                  <div className={`flex items-center gap-1.5 ${pwdChecks.length ? "text-emerald-500 font-semibold" : "opacity-50"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> 8+ Characters
                  </div>
                  <div className={`flex items-center gap-1.5 ${pwdChecks.upper ? "text-emerald-500 font-semibold" : "opacity-50"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uppercase
                  </div>
                  <div className={`flex items-center gap-1.5 ${pwdChecks.lower ? "text-emerald-500 font-semibold" : "opacity-50"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Lowercase
                  </div>
                  <div className={`flex items-center gap-1.5 ${pwdChecks.number ? "text-emerald-500 font-semibold" : "opacity-50"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Number
                  </div>
                  <div className={`flex items-center gap-1.5 ${pwdChecks.special ? "text-emerald-500 font-semibold" : "opacity-50"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Special (!@#$)
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              Create Account
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/50" />
            </div>
            <span className="relative glass-panel px-4 py-1 rounded-full text-xs font-medium uppercase opacity-70">
              Or continue with
            </span>
          </div>

          {/* Google OAuth Button */}
          <GoogleAuthButton onSuccessRedirect="/" onError={setError} />

          {/* Footer Navigation */}
          <p className="text-center text-xs opacity-80 mt-5">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
