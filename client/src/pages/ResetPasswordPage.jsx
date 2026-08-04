import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/common/Button";
import { FileText, Lock, AlertCircle, CheckCircle2, Eye, EyeOff, Sun, Moon, ArrowRight } from "lucide-react";

export const ResetPasswordPage = () => {
  const { token: resetToken } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password Requirement Checks
  const pwdChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*]/.test(password),
  };

  const isStrong = Object.values(pwdChecks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isStrong) {
      setError("Password does not meet security requirements.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authService.resetPassword(resetToken, password);
      setIsSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Invalid or expired reset token. Please request a new link."
      );
    } finally {
      setIsLoading(false);
    }
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
            Set New Password
          </h1>
          <p className="text-sm opacity-70 mt-2">
            Create a secure password for your SyncWrite account
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

          {isSuccess ? (
            <div className="text-center space-y-6 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Password Reset Successful!</h2>
                <p className="text-xs opacity-70 mt-2">
                  Your password has been updated. You can now log in using your new password.
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("/login")}
                className="w-full"
              >
                Proceed to Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 opacity-50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="••••••••"
                    className="w-full glass-panel rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-indigo-500 transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password Requirement hints */}
                {password.length > 0 && (
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

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 opacity-50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="••••••••"
                    className="w-full glass-panel rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-2"
              >
                Reset Password
              </Button>
            </form>
          )}

          {/* Footer Navigation */}
          <p className="text-center text-xs opacity-80 mt-6">
            Remembered your password?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
            >
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
