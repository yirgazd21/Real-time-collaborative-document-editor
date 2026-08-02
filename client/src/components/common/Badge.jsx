import React from "react";

const roleStyles = {
  owner: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  editor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  commenter: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  viewer: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

export const Badge = ({ role = "viewer", className = "" }) => {
  const normalizedRole = role ? role.toLowerCase() : "viewer";
  const style = roleStyles[normalizedRole] || roleStyles.viewer;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${style} ${className}`}
    >
      {role}
    </span>
  );
};
