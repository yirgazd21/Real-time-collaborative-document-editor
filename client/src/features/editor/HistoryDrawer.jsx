import React, { useState, useEffect } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { versionService } from "../../services/versionService";
import { Avatar } from "../../components/common/Avatar";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import {
  History,
  X,
  Plus,
  RotateCcw,
  Loader2,
  Eye,
  Calendar,
} from "lucide-react";

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
  const [selectedRevisionForPreview, setSelectedRevisionForPreview] = useState(null);

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
        `Are you sure you want to restore to revision "${versionName}"? Current document content will be saved automatically as a safeguard.`
      )
    ) {
      try {
        const res = await versionService.restoreRevision(documentId, revisionId);
        if (onRestoreSuccess) {
          onRestoreSuccess(res.document);
        }
        setSelectedRevisionForPreview(null);
        onClose();
      } catch (err) {
        console.error("Restore failed:", err);
      }
    }
  };

  if (!isOpen) return null;

  const canEdit = userAccessLevel === "owner" || userAccessLevel === "editor";

  return (
    <>
      <aside className="w-80 lg:w-96 flex-shrink-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 flex flex-col justify-between transition-colors animate-in fade-in slide-in-from-right-4 duration-200 text-slate-900 dark:text-white">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Version History
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Create Snapshot Form */}
          {canEdit && (
            <form onSubmit={handleCreateRevision} className="mt-3 space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
                Save Revision Snapshot
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  placeholder="Snapshot label (e.g. Draft v1)..."
                  className="flex-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
            ) : revisions.length > 0 ? (
              revisions.map((rev) => {
                const formattedExact = rev.createdAt
                  ? format(new Date(rev.createdAt), "MMM d, yyyy 'at' h:mm a")
                  : "N/A";
                const formattedRelative = rev.createdAt
                  ? formatDistanceToNow(new Date(rev.createdAt), { addSuffix: true })
                  : "";

                return (
                  <div
                    key={rev._id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {rev.versionName || "Auto-saved Revision"}
                        </p>
                        <p className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
                          {rev.title || "Untitled Document"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedRevisionForPreview(rev)}
                          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors"
                          title="Preview version content"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => handleRestore(rev._id, rev.versionName)}
                            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors"
                            title="Restore this version"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Author Info */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                      <Avatar
                        name={rev.createdBy?.name}
                        src={rev.createdBy?.avatar}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-extrabold text-slate-900 dark:text-white truncate">
                          {rev.createdBy?.name || "Unknown Author"}
                        </p>
                        {rev.createdBy?.email && (
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                            {rev.createdBy.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center justify-between text-[10px] font-bold pt-0.5">
                      <span className="flex items-center gap-1 font-mono text-indigo-600 dark:text-indigo-400">
                        <Calendar className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        {formattedExact}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">({formattedRelative})</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-xs font-bold text-slate-500 py-8">
                No previous revisions saved yet.
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Revision Content Preview Modal */}
      {selectedRevisionForPreview && (
        <Modal
          isOpen={Boolean(selectedRevisionForPreview)}
          onClose={() => setSelectedRevisionForPreview(null)}
          title={`Preview Revision: ${selectedRevisionForPreview.versionName}`}
        >
          <div className="space-y-4">
            {/* Meta details */}
            <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl p-3 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-bold">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={selectedRevisionForPreview.createdBy?.name}
                    src={selectedRevisionForPreview.createdBy?.avatar}
                    size="sm"
                  />
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white">
                      {selectedRevisionForPreview.createdBy?.name || "Unknown"}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                      {selectedRevisionForPreview.createdBy?.email}
                    </p>
                  </div>
                </div>

                <div className="text-right text-[11px]">
                  <p className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    {selectedRevisionForPreview.createdAt &&
                      format(
                        new Date(selectedRevisionForPreview.createdAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 font-bold">
                    {selectedRevisionForPreview.createdAt &&
                      formatDistanceToNow(
                        new Date(selectedRevisionForPreview.createdAt),
                        { addSuffix: true }
                      )}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-500 dark:text-slate-400">Title:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {selectedRevisionForPreview.title || "Untitled Document"}
                </span>
              </div>
            </div>

            {/* Render HTML content snapshot preview */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider mb-2">
                Content Snapshot
              </label>
              <div
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 max-h-80 overflow-y-auto text-sm text-slate-900 dark:text-white font-medium prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html:
                    typeof selectedRevisionForPreview.content === "string"
                      ? selectedRevisionForPreview.content
                      : JSON.stringify(selectedRevisionForPreview.content),
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setSelectedRevisionForPreview(null)}
              >
                Close Preview
              </Button>
              {canEdit && (
                <Button
                  variant="primary"
                  onClick={() =>
                    handleRestore(
                      selectedRevisionForPreview._id,
                      selectedRevisionForPreview.versionName
                    )
                  }
                >
                  <RotateCcw className="w-4 h-4" /> Restore This Revision
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
