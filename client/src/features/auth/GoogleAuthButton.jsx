import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export const GoogleAuthButton = ({ onSuccessRedirect = "/", onError }) => {
  const { googleAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      if (credentialResponse.credential) {
        await googleAuth(credentialResponse.credential);
        navigate(onSuccessRedirect, { replace: true });
      } else {
        if (onError) onError("No credential returned from Google.");
      }
    } catch (err) {
      console.error("Google Auth error:", err);
      if (onError) {
        onError(err.message || "Google Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    console.error("Google Sign-In popup closed or failed");
    if (onError) onError("Google Sign-In was cancelled or failed.");
  };

  return (
    <div className="w-full flex justify-center my-3 relative">
      {loading && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs rounded-full flex items-center justify-center z-10">
          <span className="text-xs text-indigo-400 font-medium animate-pulse">
            Authenticating...
          </span>
        </div>
      )}
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        theme="filled_dark"
        shape="pill"
        size="large"
        width={380}
        text="continue_with"
      />
    </div>
  );
};
