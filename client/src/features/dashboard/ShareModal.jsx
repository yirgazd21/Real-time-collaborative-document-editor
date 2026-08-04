import React, { useState, useEffect } from "react";
import { Modal } from "../../components/common/Modal";
import { Button } from "../../components/common/Button";
import { Avatar } from "../../components/common/Avatar";
import { Badge } from "../../components/common/Badge";
import { Mail, UserPlus, Globe, Check, Copy, Trash2, Shield } from "lucide-react";

export const ShareModal = ({
  isOpen,
  onClose,
  document,
  onShare,
  onRemoveCollaborator,
}) => {
  if (!document) return null;

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [isPublic, setIsPublic] = useState(document.isPublic || false);
  const [publicRole, setPublicRole] = useState(document.publicRole || "viewer");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (document) {
      setIsPublic(Boolean(document.isPublic));
      setPublicRole(document.publicRole || "viewer");
    }
  }, [document]);

  const [shareError, setShareError] = useState("");

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setShareError("");
    try {
      await onShare({ email, role });
      setEmail("");
    } catch (err) {
      setShareError(
        err.response?.data?.message ||
        err.message ||
        "Failed to share document."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlterRole = async (userEmail, newRole) => {
    await onShare({ email: userEmail, role: newRole });
  };

  const handleTogglePublic = async (newIsPublic, newPublicRole) => {
    setIsPublic(newIsPublic);
    setPublicRole(newPublicRole);
    await onShare({ isPublic: newIsPublic, publicRole: newPublicRole });
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/document/${document._id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Collaborators & Permissions`}>
      <div className="space-y-6">
        {/* Invite New Collaborator Form */}
        <form onSubmit={handleAddCollaborator} className="space-y-3">
          {shareError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold">
              {shareError}
            </div>
          )}
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-70">
            Invite Collaborator
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 opacity-50" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full glass-panel rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="glass-panel rounded-xl px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="editor">Editor</option>
              <option value="commenter">Commenter</option>
              <option value="viewer">Viewer</option>
            </select>
            <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Existing Collaborators List with Permission Alter Selector */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-3 flex items-center justify-between">
            <span>Collaborators ({document.collaborators?.length || 0})</span>
            <span className="text-[11px] text-indigo-500 font-mono flex items-center gap-1">
              <Shield className="w-3 h-3" /> Owner Permission Controls
            </span>
          </h4>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {/* Document Owner */}
            <div className="flex items-center justify-between p-2.5 rounded-xl glass-panel border border-slate-700/40">
              <div className="flex items-center gap-3">
                <Avatar name={document.owner?.name} src={document.owner?.avatar} size="sm" />
                <div>
                  <p className="text-xs font-semibold">{document.owner?.name}</p>
                  <p className="text-[11px] opacity-60">{document.owner?.email}</p>
                </div>
              </div>
              <Badge role="owner" />
            </div>

            {/* Invited Active Collaborators */}
            {document.collaborators?.map((collab) => (
              <div
                key={collab.user?._id || collab.user}
                className="flex items-center justify-between p-2.5 rounded-xl glass-panel border border-slate-700/40"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={collab.user?.name} src={collab.user?.avatar} size="sm" />
                  <div>
                    <p className="text-xs font-semibold">{collab.user?.name || "Invited User"}</p>
                    <p className="text-[11px] opacity-60">{collab.user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={collab.role}
                    onChange={(e) => handleAlterRole(collab.user?.email, e.target.value)}
                    className="glass-panel rounded-lg px-2.5 py-1 text-xs font-semibold text-indigo-500 border border-slate-700/50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="editor">Editor</option>
                    <option value="commenter">Commenter</option>
                    <option value="viewer">Viewer</option>
                  </select>

                  {onRemoveCollaborator && (
                    <button
                      onClick={() => onRemoveCollaborator(collab.user?._id)}
                      className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:text-rose-500 transition-colors"
                      title="Revoke Access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Pending Invites (Users who have not registered yet) */}
            {document.pendingInvites?.map((pending) => (
              <div
                key={pending.email}
                className="flex items-center justify-between p-2.5 rounded-xl glass-panel border border-dashed border-indigo-500/40 bg-indigo-500/5"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={pending.email} size="sm" />
                  <div>
                    <p className="text-xs font-semibold">{pending.email}</p>
                    <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Pending Invite
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={pending.role}
                    onChange={(e) => handleAlterRole(pending.email, e.target.value)}
                    className="glass-panel rounded-lg px-2.5 py-1 text-xs font-semibold text-indigo-500 border border-slate-700/50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="editor">Editor</option>
                    <option value="commenter">Commenter</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Public Link Sharing Controls */}
        <div className="pt-3 border-t border-slate-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold">Public Link Sharing</p>
                <p className="text-[11px] opacity-60">Anyone with the link can view or edit</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => handleTogglePublic(e.target.checked, publicRole)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          {isPublic && (
            <div className="flex items-center gap-2 pl-9">
              <span className="text-xs opacity-70">Default Public Role:</span>
              <select
                value={publicRole}
                onChange={(e) => handleTogglePublic(true, e.target.value)}
                className="glass-panel rounded-lg px-2 py-1 text-xs"
              >
                <option value="viewer">Viewer</option>
                <option value="commenter">Commenter</option>
                <option value="editor">Editor</option>
              </select>
            </div>
          )}

          {/* Copy Link Button */}
          <Button variant="secondary" size="md" className="w-full" onClick={copyShareLink}>
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500">Link Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Document Access Link</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
