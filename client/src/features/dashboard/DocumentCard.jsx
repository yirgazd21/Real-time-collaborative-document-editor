import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { Avatar } from "../../components/common/Avatar";
import { Badge } from "../../components/common/Badge";
import {
  FileText,
  MoreVertical,
  Copy,
  Trash2,
  Users,
  ExternalLink,
  Edit2,
  Calendar,
  Clock,
  UserCheck,
} from "lucide-react";

export const DocumentCard = ({
  doc,
  currentUserId,
  onRename,
  onDuplicate,
  onDelete,
  onShare,
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isOwner = doc.owner?._id === currentUserId;
  const userAccess = isOwner
    ? "owner"
    : doc.collaborators?.find((c) => c.user?._id === currentUserId)?.role ||
      (doc.isPublic ? doc.publicRole : "viewer");

  const createdDateStr = doc.createdAt
    ? format(new Date(doc.createdAt), "MMM d, yyyy")
    : "N/A";

  const lastModifiedStr = doc.updatedAt
    ? formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })
    : "Recently";

  const ownerName = isOwner
    ? "You"
    : doc.owner?.name || doc.owner?.email || "Unknown Owner";

  const handleCardClick = () => {
    // Record recent opened document in localStorage
    try {
      const recentIds = JSON.parse(localStorage.getItem("recentlyOpenedDocs") || "[]");
      const filtered = recentIds.filter((id) => id !== doc._id);
      filtered.unshift(doc._id);
      localStorage.setItem("recentlyOpenedDocs", JSON.stringify(filtered.slice(0, 20)));
    } catch (err) {
      console.error("Failed to update recently opened docs", err);
    }
    navigate(`/document/${doc._id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative glass-panel rounded-2xl p-5 border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between cursor-pointer min-h-[220px]"
    >
      {/* Top Bar: Icon, Access Badge & Context Menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-500 group-hover:text-white transition-all">
          <FileText className="w-5 h-5" />
        </div>

        <div className="flex items-center gap-2">
          <Badge role={userAccess} />

          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-slate-800/40 transition-colors"
              title="Document Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 glass-panel rounded-xl p-1.5 shadow-2xl border border-slate-700/60 z-30 text-xs font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              >
                <button
                  onClick={handleCardClick}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Document
                </button>

                {onRename && (userAccess === "owner" || userAccess === "editor") && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRename(doc);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Rename
                  </button>
                )}

                {onShare && (userAccess === "owner" || userAccess === "editor") && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(doc);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" /> Manage Collaborators
                  </button>
                )}

                {onDuplicate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(doc._id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                )}

                {isOwner && onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(doc._id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border-t border-slate-800/80 mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Content: Title */}
      <div className="my-3">
        <h3
          className="text-base font-bold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1"
          title={doc.title || "Untitled Document"}
        >
          {doc.title || "Untitled Document"}
        </h3>
      </div>

      {/* Explicit Metadata Section: Owner, Date Created, Last Modified */}
      <div className="space-y-1.5 text-[11px] opacity-80 border-t border-b border-slate-800/60 py-2.5 my-1">
        {/* Owner */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-medium text-slate-400">Owner:</span>
          <span className="font-semibold text-slate-200 truncate max-w-[140px]">
            {ownerName}
          </span>
        </div>

        {/* Date Created */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Created:</span>
          <span className="text-slate-300">{createdDateStr}</span>
        </div>

        {/* Last Modified */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Modified:</span>
          <span className="text-slate-300">{lastModifiedStr}</span>
        </div>
      </div>

      {/* Footer: Owner Avatar & Shared Badge */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Avatar
            name={doc.owner?.name}
            src={doc.owner?.avatar}
            size="sm"
          />
          <span className="text-xs font-medium text-slate-300 truncate max-w-[110px]">
            {ownerName}
          </span>
        </div>

        {onShare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(doc);
            }}
            className="text-[11px] font-mono opacity-80 hover:opacity-100 hover:bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/30 transition-all flex items-center gap-1"
            title="View Collaborators"
          >
            <Users className="w-3 h-3" />
            <span>{doc.collaborators?.length || 0} shared</span>
          </button>
        )}
      </div>
    </div>
  );
};
