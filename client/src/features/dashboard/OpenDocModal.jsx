import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../components/common/Modal";
import { Button } from "../../components/common/Button";
import {
  ExternalLink,
  Link2,
  FileText,
  UserCheck,
  CheckCircle2,
  Users,
  Search,
} from "lucide-react";

export const OpenDocModal = ({ isOpen, onClose, documents = [] }) => {
  const [activeTab, setActiveTab] = useState("existing"); // 'existing' | 'url'
  const [selectedDocId, setSelectedDocId] = useState("");
  const [docInput, setDocInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleOpenLink = (e) => {
    e.preventDefault();
    setError("");

    const trimmed = docInput.trim();
    if (!trimmed) {
      setError("Please enter a document ID or shared URL");
      return;
    }

    let docId = trimmed;
    if (trimmed.includes("/document/")) {
      const parts = trimmed.split("/document/");
      docId = parts[parts.length - 1].split("?")[0].split("#")[0];
    }

    if (!docId) {
      setError("Invalid document ID or link format");
      return;
    }

    setDocInput("");
    onClose();
    // Navigating to document will trigger backend getDocumentById which auto-adds user to collaborators
    navigate(`/document/${docId}`);
  };

  const handleOpenExisting = (e) => {
    e.preventDefault();
    if (!selectedDocId) {
      setError("Please select a document to open");
      return;
    }
    onClose();
    navigate(`/document/${selectedDocId}`);
  };

  const filteredDocs = documents.filter((doc) =>
    doc.title?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Open Document">
      <div className="space-y-4">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-black text-white rounded-xl text-xs font-black">
          <button
            type="button"
            onClick={() => {
              setActiveTab("existing");
              setError("");
            }}
            className={`flex-1 py-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "existing"
                ? "bg-white text-black shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Select Existing File</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("url");
              setError("");
            }}
            className={`flex-1 py-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "url"
                ? "bg-white text-black shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Paste Shared URL / Link</span>
          </button>
        </div>

        {/* TAB 1: Select Existing File Dropdown / Searchable List */}
        {activeTab === "existing" && (
          <form onSubmit={handleOpenExisting} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-2">
                Choose Existing Document
              </label>

              {documents.length > 0 ? (
                <div className="space-y-2">
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-black dark:text-slate-400" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Filter files..."
                      className="w-full bg-white dark:bg-black text-black dark:text-white border-2 border-black rounded-xl pl-9 pr-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {filteredDocs.map((doc) => (
                      <div
                        key={doc._id}
                        onClick={() => {
                          setSelectedDocId(doc._id);
                          setError("");
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedDocId === doc._id
                            ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-600 font-black"
                            : "bg-white dark:bg-black border-black/20 dark:border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-black dark:text-white truncate">
                              {doc.title || "Untitled Document"}
                            </p>
                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate">
                              Owner: {doc.owner?.name || "User"}
                            </p>
                          </div>
                        </div>

                        {selectedDocId === doc._id && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-500 py-3 text-center">
                  No existing documents found.
                </p>
              )}
            </div>

            {error && <p className="text-xs font-bold text-rose-500">{error}</p>}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!selectedDocId}
              >
                <ExternalLink className="w-4 h-4" /> Open Selected File
              </Button>
            </div>
          </form>
        )}

        {/* TAB 2: Paste Shared URL / Link (Auto-Invites to Collaboration) */}
        {activeTab === "url" && (
          <form onSubmit={handleOpenLink} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-2">
                Shared Document URL or ID
              </label>

              <div className="relative">
                <Link2 className="absolute left-3.5 top-3 w-4 h-4 text-black dark:text-white" />
                <input
                  type="text"
                  autoFocus
                  value={docInput}
                  onChange={(e) => {
                    setDocInput(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. http://localhost:5173/document/67a1b2... or 67a1b2..."
                  className="w-full bg-white dark:bg-black text-black dark:text-white border-2 border-black rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Shared Link Collaboration Auto-Invite Hint */}
              <div className="mt-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-start gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                <Users className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  Opening a shared link will automatically join the document room and invite you as a collaborator so it appears in your <strong>Shared with Me</strong> list!
                </p>
              </div>

              {error && <p className="text-xs font-bold text-rose-500 mt-2">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!docInput.trim()}
              >
                <ExternalLink className="w-4 h-4" /> Open & Join Collaboration
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
