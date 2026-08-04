import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
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

  const getRecentlyOpenedDocs = () => {
    try {
      const recentMap = JSON.parse(localStorage.getItem("recentlyOpenedMap") || "{}");
      const docMap = new Map(documents.all.map((d) => [d._id, d]));
      const result = [];

      const sortedEntries = Object.entries(recentMap).sort((a, b) => b[1] - a[1]);

      for (const [id, openedAt] of sortedEntries) {
        if (docMap.has(id)) {
          const doc = docMap.get(id);
          result.push({
            ...doc,
            lastOpenedAt: openedAt,
          });
          docMap.delete(id);
        }
      }

      const remaining = Array.from(docMap.values())
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .map((d) => ({
          ...d,
          lastOpenedAt: new Date(d.updatedAt).getTime(),
        }));

      return [...result, ...remaining];
    } catch (e) {
      console.error("Error reading recent docs map", e);
    }

    return [...documents.all]
      .map((d) => ({
        ...d,
        lastOpenedAt: new Date(d.updatedAt).getTime(),
      }))
      .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
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
    <div className="min-h-screen transition-colors flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <Navbar onSearchChange={setSearchQuery} searchValue={searchQuery} />

      {/* Main Google Docs Style Full-Width Container */}
      <div className="flex-1 flex flex-col md:flex-row w-full">
        
        {/* GOOGLE DOCS STYLE RESPONSIVE SIDEBAR */}
        <aside className="w-full md:w-64 lg:w-72 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 md:space-y-6 flex flex-col justify-between">
          <div className="space-y-4 md:space-y-6">
            {/* Standard Google Docs Blank Document Action Button */}
            <div>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all font-extrabold text-sm shadow-sm hover:shadow-md"
              >
                <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Blank Document</span>
              </button>
            </div>

            {/* Main Navigation Menu */}
            <nav className="flex flex-row md:flex-col overflow-x-auto gap-2 md:gap-1 pb-2 md:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 min-w-[140px] md:min-w-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === "all"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-extrabold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <FolderOpen className="w-4 h-4 shrink-0" />
                <span>All Documents</span>
                <span className="ml-auto text-[11px] opacity-70">({documents.all.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("recent")}
                className={`flex-1 min-w-[140px] md:min-w-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === "recent"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-extrabold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Recent Docs</span>
                <span className="ml-auto text-[11px] opacity-70">({recentDocsList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("owned")}
                className={`flex-1 min-w-[140px] md:min-w-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === "owned"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-extrabold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Owned by me</span>
                <span className="ml-auto text-[11px] opacity-70">({documents.owned.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("shared")}
                className={`flex-1 min-w-[140px] md:min-w-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === "shared"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-extrabold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Users className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Shared with me</span>
                <span className="ml-auto text-[11px] opacity-70">({documents.shared.length})</span>
              </button>
            </nav>

            {/* RECENTLY OPENED LIST */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between px-2 text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                <span>Recently Opened</span>
                <span className="text-[10px] text-slate-500 font-bold">{recentDocsList.length}</span>
              </div>

              {recentDocsList.length > 0 ? (
                <div className="space-y-1 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
                  {recentDocsList.slice(0, 10).map((doc) => {
                    const isOwner = doc.owner?._id === user?._id;
                    const ownerName = isOwner ? "You" : doc.owner?.name || "Owner";
                    const formattedOpenedTime = doc.lastOpenedAt
                      ? formatDistanceToNow(new Date(doc.lastOpenedAt), { addSuffix: true })
                      : "Recently";

                    return (
                      <button
                        key={doc._id}
                        onClick={() => {
                          try {
                            const recentMap = JSON.parse(
                              localStorage.getItem("recentlyOpenedMap") || "{}"
                            );
                            recentMap[doc._id] = Date.now();
                            localStorage.setItem(
                              "recentlyOpenedMap",
                              JSON.stringify(recentMap)
                            );
                          } catch (err) {}
                          navigate(`/document/${doc._id}`);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                        title={`Opened ${formattedOpenedTime}`}
                      >
                        <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                            {doc.title || "Untitled"}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                            {ownerName} • Opened {formattedOpenedTime}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-400 px-2 py-1">
                  No recently opened docs.
                </p>
              )}
            </div>
          </div>

          {/* Quick Action Button at Sidebar Bottom */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsOpenDocModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Open Document</span>
            </button>
          </div>
        </aside>

        {/* RIGHT MAIN WORKSPACE AREA */}
        <main className="flex-1 p-6 lg:p-8 space-y-6 min-w-0">
          
          {/* Header Title & Action ("Open" button) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                {activeTab === "all" && "All Documents"}
                {activeTab === "recent" && "Recent Documents"}
                {activeTab === "owned" && "Owned by Me"}
                {activeTab === "shared" && "Shared with Me"}
              </h1>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
                Welcome back, {user?.name} 👋 • Real-time collaboration space
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchDocuments(searchQuery)}
                className="p-2 rounded-xl text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-slate-300 dark:border-slate-700"
                title="Refresh List"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <Button
                variant="primary"
                size="md"
                onClick={() => setIsOpenDocModalOpen(true)}
                className="font-extrabold text-xs px-4"
              >
                <FolderOpen className="w-4 h-4" /> Open
              </Button>
            </div>
          </div>

          {/* Document Cards Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mb-3" />
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Loading documents...</p>
            </div>
          ) : displayedDocs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center max-w-md mx-auto my-12 space-y-4 border border-slate-200 dark:border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">No Documents Found</h3>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                {searchQuery
                  ? `No documents matching "${searchQuery}"`
                  : "Create your first document to start writing and collaborating."}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsCreateOpen(true)}
                  className="font-extrabold text-xs"
                >
                  <Plus className="w-4 h-4" /> Blank Document
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setIsOpenDocModalOpen(true)}
                  className="font-extrabold text-xs"
                >
                  <FolderOpen className="w-4 h-4" /> Open
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Modal */}
      <CreateDocModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateDocument}
      />

      {/* Open Document Modal */}
      <OpenDocModal
        isOpen={isOpenDocModalOpen}
        onClose={() => setIsOpenDocModalOpen(false)}
        documents={documents.all}
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
