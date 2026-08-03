import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { docService } from "../services/docService";
import { Navbar } from "../components/common/Navbar";
import { DocumentCard } from "../features/dashboard/DocumentCard";
import { CreateDocModal } from "../features/dashboard/CreateDocModal";
import { RenameDocModal } from "../features/dashboard/RenameDocModal";
import { OpenDocModal } from "../features/dashboard/OpenDocModal";
import { ShareModal } from "../features/dashboard/ShareModal";
import { Button } from "../components/common/Button";
import {
  Plus,
  FileText,
  Users,
  FolderOpen,
  Loader2,
  RefreshCw,
  Clock,
  ExternalLink,
} from "lucide-react";

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState({ owned: [], shared: [], all: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'recent' | 'owned' | 'shared'

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isOpenDocModalOpen, setIsOpenDocModalOpen] = useState(false);
  const [selectedDocForShare, setSelectedDocForShare] = useState(null);
  const [selectedDocForRename, setSelectedDocForRename] = useState(null);

  const fetchDocuments = async (query = "") => {
    setLoading(true);
    try {
      const data = await docService.getDocuments(query);
      setDocuments({
        owned: data.owned || [],
        shared: data.shared || [],
        all: data.all || [],
      });
    } catch (err) {
      console.error("Error loading documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(searchQuery);
  }, [searchQuery]);

  const handleCreateDocument = async (title) => {
    const data = await docService.createDocument({ title });
    if (data.document?._id) {
      navigate(`/document/${data.document._id}`);
    }
  };

  const handleRenameDocument = async (docId, newTitle) => {
    await docService.renameDocument(docId, newTitle);
    fetchDocuments(searchQuery);
  };

  const handleDuplicate = async (id) => {
    await docService.duplicateDocument(id);
    fetchDocuments(searchQuery);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      await docService.deleteDocument(id);
      fetchDocuments(searchQuery);
    }
  };

  const handleShareSubmit = async (shareData) => {
    if (!selectedDocForShare) return;
    const updated = await docService.shareDocument(
      selectedDocForShare._id,
      shareData
    );
    setSelectedDocForShare(updated.document);
    fetchDocuments(searchQuery);
  };

  const handleRemoveCollaborator = async (targetUserId) => {
    if (!selectedDocForShare) return;
    const updated = await docService.removeCollaborator(
      selectedDocForShare._id,
      targetUserId
    );
    setSelectedDocForShare(updated.document);
    fetchDocuments(searchQuery);
  };

  // Helper to retrieve recently opened documents from localStorage & sorted updatedAt
  const getRecentlyOpenedDocs = () => {
    try {
      const recentIds = JSON.parse(localStorage.getItem("recentlyOpenedDocs") || "[]");
      if (recentIds.length > 0) {
        const docMap = new Map(documents.all.map((d) => [d._id, d]));
        const ordered = [];
        for (const id of recentIds) {
          if (docMap.has(id)) {
            ordered.push(docMap.get(id));
            docMap.delete(id);
          }
        }
        // Append remaining documents sorted by updatedAt
        const remaining = Array.from(docMap.values()).sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        return [...ordered, ...remaining];
      }
    } catch (e) {
      console.error("Error reading recent docs", e);
    }
    // Fallback sort by updatedAt descending
    return [...documents.all].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
  };

  const getDisplayedDocs = () => {
    if (activeTab === "recent") return getRecentlyOpenedDocs();
    if (activeTab === "owned") return documents.owned;
    if (activeTab === "shared") return documents.shared;
    return documents.all;
  };

  const displayedDocs = getDisplayedDocs();
  const recentDocsList = getRecentlyOpenedDocs();

  return (
    <div className="min-h-screen transition-colors flex flex-col">
      <Navbar onSearchChange={setSearchQuery} searchValue={searchQuery} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Welcome & Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-sm opacity-70 mt-1">
              Manage your documents and collaborate with your team in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsOpenDocModalOpen(true)}
              className="bg-slate-800/40 hover:bg-slate-800 text-slate-200"
            >
              <ExternalLink className="w-4 h-4 text-indigo-400" />
              <span>Open Existing</span>
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsCreateOpen(true)}
              className="shadow-xl shadow-indigo-600/30"
            >
              <Plus className="w-5 h-5" />
              <span>New Document</span>
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{documents.all.length}</p>
              <p className="text-xs opacity-70">Total Accessible</p>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{recentDocsList.length}</p>
              <p className="text-xs opacity-70">Recently Opened</p>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{documents.owned.length}</p>
              <p className="text-xs opacity-70">Owned by You</p>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{documents.shared.length}</p>
              <p className="text-xs opacity-70">Shared with You</p>
            </div>
          </div>
        </div>

        {/* Filters & Tabs */}
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "opacity-70 hover:opacity-100 hover:bg-slate-800/20"
              }`}
            >
              All Documents ({documents.all.length})
            </button>

            <button
              onClick={() => setActiveTab("recent")}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "recent"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "opacity-70 hover:opacity-100 hover:bg-slate-800/20"
              }`}
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Recently Opened ({recentDocsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("owned")}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === "owned"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "opacity-70 hover:opacity-100 hover:bg-slate-800/20"
              }`}
            >
              Owned by Me ({documents.owned.length})
            </button>

            <button
              onClick={() => setActiveTab("shared")}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === "shared"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "opacity-70 hover:opacity-100 hover:bg-slate-800/20"
              }`}
            >
              Shared with Me ({documents.shared.length})
            </button>
          </div>

          <button
            onClick={() => fetchDocuments(searchQuery)}
            className="p-2 rounded-xl opacity-70 hover:opacity-100 hover:bg-slate-800/20 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Document Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
            <p className="text-sm opacity-70">Loading documents...</p>
          </div>
        ) : displayedDocs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedDocs.map((doc) => (
              <DocumentCard
                key={doc._id}
                doc={doc}
                currentUserId={user?._id}
                onRename={(d) => setSelectedDocForRename(d)}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onShare={(d) => setSelectedDocForShare(d)}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto my-12 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold">No Documents Found</h3>
            <p className="text-sm opacity-70">
              {searchQuery
                ? `No documents matching "${searchQuery}"`
                : "Create your first document to start writing and collaborating."}
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateOpen(true)}
              className="mx-auto mt-2"
            >
              <Plus className="w-4 h-4" /> Create Document
            </Button>
          </div>
        )}
      </main>

      {/* Create Modal */}
      <CreateDocModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateDocument}
      />

      {/* Open Existing Doc Modal */}
      <OpenDocModal
        isOpen={isOpenDocModalOpen}
        onClose={() => setIsOpenDocModalOpen(false)}
      />

      {/* Rename Modal */}
      <RenameDocModal
        isOpen={Boolean(selectedDocForRename)}
        onClose={() => setSelectedDocForRename(null)}
        document={selectedDocForRename}
        onRename={handleRenameDocument}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={Boolean(selectedDocForShare)}
        onClose={() => setSelectedDocForShare(null)}
        document={selectedDocForShare}
        onShare={handleShareSubmit}
        onRemoveCollaborator={handleRemoveCollaborator}
      />
    </div>
  );
};
