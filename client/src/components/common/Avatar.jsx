import React from "react";

export const Avatar = ({
  name = "User",
  src = "",
  size = "md",
  isOnline = false,
  className = "",
}) => {
  const sizeClasses = {
    xs: "w-5 h-5 text-[10px]",
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base",
    xl: "w-14 h-14 text-lg",
  };

  const badgeSizes = {
    xs: "w-1.5 h-1.5 border-1",
    sm: "w-2 h-2 border-1",
    md: "w-2.5 h-2.5 border-2",
    lg: "w-3 h-3 border-2",
    xl: "w-3.5 h-3.5 border-2",
  };

  const getInitials = (n) => {
    if (!n) return "U";
    const parts = n.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-indigo-500/30`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-semibold text-white flex items-center justify-center shadow-md ring-2 ring-indigo-500/20`}
        >
          {getInitials(name)}
        </div>
      )}
      {isOnline && (
        <span
          className={`absolute bottom-0 right-0 rounded-full bg-emerald-500 border-slate-900 ${badgeSizes[size]}`}
          title="Online"
        />
      )}
    </div>
  );
};
