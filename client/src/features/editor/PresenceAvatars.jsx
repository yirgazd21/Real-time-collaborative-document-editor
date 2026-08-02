import React from "react";
import { Avatar } from "../../components/common/Avatar";

export const PresenceAvatars = ({ presenceList = [], currentUserId }) => {
  if (!presenceList || presenceList.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" />
      <span className="text-xs font-semibold text-slate-300 mr-1">
        {presenceList.length} Active
      </span>

      <div className="flex -space-x-2 overflow-hidden">
        {presenceList.map((user) => {
          const isSelf = user.userId === currentUserId;
          return (
            <div
              key={user.socketId}
              className="relative group"
              title={`${user.name} ${isSelf ? "(You)" : ""}`}
            >
              <Avatar
                name={user.name}
                src={user.avatar}
                size="sm"
                className="ring-2 ring-slate-950"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
