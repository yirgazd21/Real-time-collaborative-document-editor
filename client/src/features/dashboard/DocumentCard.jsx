import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Avatar } from "../../components/common/Avatar";
import { Badge } from "../../components/common/Badge";
import {
  FileText,
  MoreVertical,
  Copy,
  Trash2,
  Share2,
  ExternalLink,
  Edit2,
  Users,
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

  const formattedDate = doc.updatedAt
    ? formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })
    : "Recently";

  return (
    <div className="group relative glass-panel rounded-2xl p-5 border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between h-48">
      {/* Top Bar: Icon & Menu */}
      <div className="flex items-start justify-between gap-3">
        <div
          onClick={() => navigate(`/document/${doc._id}`)}
          className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center cursor-pointer group-hover:scale-105 group-hover:bg-indigo-500 group-hover:text-white transition-all"
        >
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
                  onClick={() => navigate(`/document/${doc._id}`)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Document
                </button>
                {onRename && (
                  <button
                    onClick={() => onRename(doc)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Rename
                  </button>
                )}
                {onShare && (
                  <button
                    onClick={() => onShare(doc)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" /> Manage Collaborators
                  </button>
                )}
                {onDuplicate && (
                  <button
                    onClick={() => onDuplicate(doc._id)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                )}
                {isOwner && onDelete && (
                  <button
                    onClick={() => onDelete(doc._id)}
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

      {/* Center: Title */}
      <div
        onClick={() => navigate(`/document/${doc._id}`)}
        className="cursor-pointer my-2"
      >
        <h3 className="text-base font-semibold group-hover:text-indigo-400 transition-colors line-clamp-1">
          {doc.title || "Untitled Document"}
        </h3>
        <p className="text-xs opacity-70 mt-1">Edited {formattedDate}</p>
      </div>

      {/* Footer: Owner & Collaborators Badge */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
        <div className="flex items-center gap-2">
          <Avatar
            name={doc.owner?.name}
            src={doc.owner?.avatar}
            size="sm"
          />
          <span className="text-xs opacity-70 truncate max-w-[120px]">
            {isOwner ? "You" : doc.owner?.name || "Unknown Owner"}
          </span>
        </div>

        {onShare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(doc);
            }}
            className="text-[11px] font-mono opacity-80 hover:opacity-100 hover:bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30 transition-all flex items-center gap-1"
            title="View & Edit Collaborator Permissions"
          >
            <Users className="w-3 h-3" />
            <span>{doc.collaborators?.length || 0} shared</span>
          </button>
        )}
      </div>
    </div>
  );
};
