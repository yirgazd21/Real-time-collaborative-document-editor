import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { versionService } from "../../services/versionService";
import { Avatar } from "../../components/common/Avatar";
import { Button } from "../../components/common/Button";
import { History, X, Plus, RotateCcw, Clock, Loader2 } from "lucide-react";

export const HistoryDrawer = ({
  isOpen,
  onClose,
  documentId,
  userAccessLevel,
  onRestoreSuccess,
}) => {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchRevisions = async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const data = await versionService.getRevisions(documentId);
      setRevisions(data.revisions || []);
    } catch (err) {
      console.error("Error loading revisions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRevisions();
    }
  }, [isOpen, documentId]);

  const handleCreateRevision = async (e) => {
    e.preventDefault();
    if (!newVersionName.trim()) return;
    setIsCreating(true);
    try {
      await versionService.createRevision(documentId, newVersionName.trim());
      setNewVersionName("");
      fetchRevisions();
    } catch (err) {
      console.error("Failed to create snapshot:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (revisionId, versionName) => {
    if (
      window.confirm(
        `Are you sure you want to restore to revision "${versionName}"? Current document content will be saved automatically.`
      )
    ) {
      try {
        const res = await versionService.restoreRevision(documentId, revisionId);
        if (onRestoreSuccess) {
          onRestoreSuccess(res.document);
        }
        onClose();
      } catch (err) {
        console.error("Restore failed:", err);
      }
    }
  };

  if (!isOpen) return null;

  const canEdit = userAccessLevel === "owner" || userAccessLevel === "editor";

  return (
    <aside className="w-80 lg:w-96 flex-shrink-0 glass-panel rounded-3xl border border-slate-700/50 shadow-2xl p-5 flex flex-col justify-between transition-colors animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-semibold">Version History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-slate-800/30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create Snapshot Form */}
        {canEdit && (
          <form onSubmit={handleCreateRevision} className="mt-3 space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-70">
              Save Revision Snapshot
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                placeholder="Snapshot label..."
                className="flex-1 glass-panel rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <Button type="submit" size="sm" isLoading={isCreating}>
                <Plus className="w-3.5 h-3.5" /> Save
              </Button>
            </div>
          </form>
        )}

        {/* Revision List */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : revisions.length > 0 ? (
            revisions.map((rev) => (
              <div
                key={rev._id}
                className="p-3 rounded-xl glass-panel border border-slate-700/40 hover:border-slate-700 transition-all flex items-start justify-between gap-2.5"
              >
                <div className="space-y-1.5 flex-1">
                  <p className="text-xs font-semibold">
                    {rev.versionName || "Auto-saved Revision"}
                  </p>

                  <div className="flex items-center gap-2">
                    <Avatar
                      name={rev.createdBy?.name}
                      src={rev.createdBy?.avatar}
                      size="sm"
                    />
                    <span className="text-[11px] opacity-70">
                      {rev.createdBy?.name || "Unknown Author"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] opacity-60 font-mono">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(rev.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>

                {canEdit && (
                  <button
                    onClick={() => handleRestore(rev._id, rev.versionName)}
                    className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-colors"
                    title="Restore this version"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-xs opacity-60 py-8">
              No previous revisions saved yet.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};
