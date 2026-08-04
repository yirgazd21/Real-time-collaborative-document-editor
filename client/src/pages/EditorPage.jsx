import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { PaginationPlus } from "tiptap-pagination-plus";
import { FontSize } from "../features/editor/FontSize";
import { CustomBulletList, CustomOrderedList } from "../features/editor/CustomLists";
import html2pdf from "html2pdf.js";
import { formatDistanceToNow } from "date-fns";

import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import { docService } from "../services/docService";

import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { EditorToolbar } from "../features/editor/EditorToolbar";
import { PresenceAvatars } from "../features/editor/PresenceAvatars";
import { HistoryDrawer } from "../features/editor/HistoryDrawer";
import { CommentSidebar } from "../features/editor/CommentSidebar";
import { ShareModal } from "../features/dashboard/ShareModal";
import { ImageBubbleMenu } from "../features/editor/ImageBubbleMenu";
import { ImageCropModal } from "../features/editor/ImageCropModal";
import { TableBubbleMenu } from "../features/editor/TableBubbleMenu";

import {
  ArrowLeft,
  Share2,
  History,
  MessageSquare,
  CheckCircle2,
  Loader2,
  Lock,
  Edit3,
  UserCheck,
  Sun,
  Moon,
} from "lucide-react";

const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: element => element.getAttribute('data-background-color'),
        renderHTML: attributes => {
          if (!attributes.backgroundColor) {
            return {}
          }
          return {
            'data-background-color': attributes.backgroundColor,
            style: `background-color: ${attributes.backgroundColor}`,
          }
        },
      },
    }
  },
});

// Memoized Editor Content component to prevent React Virtual DOM reconciliation crashes with Tiptap DOM mutations
const MemoizedEditorContent = React.memo(
  ({ editor }) => {
    return <EditorContent editor={editor} className="w-full" />;
  },
  (prev, next) => prev.editor === next.editor
);

export const EditorPage = () => {
  const { id: documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { theme, toggleTheme } = useTheme();

  const [docData, setDocData] = useState(null);
  const [userAccessLevel, setUserAccessLevel] = useState("viewer");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("Saved"); // 'Saved' | 'Saving...' | 'Unsaved'

  const [presenceList, setPresenceList] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const isRemoteChange = useRef(false);
  const typingTimeoutRef = useRef(null);
  const saveDebounceRef = useRef(null);

  // Initialize Tiptap Editor with Extensions
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: true,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
      }),
      CustomBulletList,
      CustomOrderedList,
      Underline,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder: "Write here...",
        emptyEditorClass: "is-editor-empty",
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      CustomTableCell,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      LinkExtension.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      PaginationPlus.configure({
        addCss: true,
      }),
    ],
    content: "",
    editable: userAccessLevel === "owner" || userAccessLevel === "editor",
    onUpdate: ({ editor }) => {
      if (isRemoteChange.current) {
        isRemoteChange.current = false;
        return;
      }

      // Ignore programmatic updates when editor is not actively focused by user
      if (!editor.isFocused) {
        return;
      }

      setSaveStatus("Saving...");
      const htmlContent = editor.getHTML();

      if (socket && isConnected) {
        socket.emit("typing", { documentId, isTyping: true });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit("typing", { documentId, isTyping: false });
        }, 1200);

        // Broadcast content changes to collaborators IMMEDIATELY
        socket.emit("send-changes", {
          documentId,
          content: htmlContent,
          title,
        });

        // Debounce database auto-save to MongoDB by 800ms
        if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = setTimeout(() => {
          socket.emit("save-document", {
            documentId,
            content: htmlContent,
            title,
          });
        }, 800);
      } else {
        // Fallback REST API save if socket disconnected
        if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = setTimeout(async () => {
          try {
            await docService.updateDocument(documentId, { content: htmlContent, title });
            setSaveStatus("Saved");
          } catch (err) {
            console.error("REST save error:", err);
            setSaveStatus("Save error");
          }
        }, 1000);
      }
    },
  });

  // Fetch Initial Document Data
  useEffect(() => {
    const loadDocument = async () => {
      try {
        const data = await docService.getDocumentById(documentId);
        setDocData(data.document);
        setUserAccessLevel(data.userAccessLevel || "viewer");
        setTitle(data.document.title || "Untitled Document");
      } catch (err) {
        console.error("Error loading document:", err);
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  // Sync Initial Document Content to Editor when Editor or Data is ready
  useEffect(() => {
    if (editor && docData && !editor.isDestroyed) {
      const currentHTML = editor.getHTML();
      if (!currentHTML || currentHTML === "<p></p>") {
        isRemoteChange.current = true;
        editor.commands.setContent(docData.content || "", false);
      }
    }
  }, [editor, docData]);

  // Configure Editor Read-Only vs Edit Permissions dynamically
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const canEdit =
        userAccessLevel === "owner" || userAccessLevel === "editor";
      isRemoteChange.current = true;
      editor.setEditable(canEdit);
    }
  }, [userAccessLevel, editor]);

  // Real-Time Socket.IO Subscriptions
  useEffect(() => {
    if (!socket || !isConnected || !documentId) return;

    // Join document room
    socket.emit("join-document", { documentId });

    // Listen for presence updates
    const handlePresence = (list) => {
      setPresenceList(list);
    };

    // Listen for live typing indicators
    const handleUserTyping = ({ userId, name, isTyping }) => {
      if (userId === user?._id) return;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(name);
        else next.delete(name);
        return next;
      });
    };

    // Listen for real-time document edit & title broadcasting from other users
    const handleReceiveChanges = ({ content, title: newTitle }) => {
      if (newTitle !== undefined) {
        setTitle(newTitle);
      }

      if (editor && !editor.isDestroyed && content !== undefined) {
        const currentHTML = editor.getHTML();
        if (currentHTML !== content) {
          isRemoteChange.current = true;
          editor.commands.setContent(content, false);
        }
      }
    };

    // Listen for real-time save success feedback across ALL participants
    const handleSaveSuccess = (data) => {
      setSaveStatus("Saved");
      if (data.title !== undefined) {
        setTitle(data.title);
      }
      setDocData((prev) =>
        prev
          ? {
            ...prev,
            title: data.title !== undefined ? data.title : prev.title,
            updatedAt: data.savedAt || new Date(),
            lastModifiedBy: data.lastModifiedBy || user,
          }
          : null
      );
    };

    const handleSaveError = (data) => {
      console.error("Socket save error:", data);
      setSaveStatus("Error saving");
    };

    socket.on("presence-update", handlePresence);
    socket.on("user-typing", handleUserTyping);
    socket.on("receive-changes", handleReceiveChanges);
    socket.on("save-success", handleSaveSuccess);
    socket.on("save-error", handleSaveError);

    return () => {
      socket.off("presence-update", handlePresence);
      socket.off("user-typing", handleUserTyping);
      socket.off("receive-changes", handleReceiveChanges);
      socket.off("save-success", handleSaveSuccess);
      socket.off("save-error", handleSaveError);
      socket.emit("leave-document");
    };
  }, [socket, isConnected, documentId, editor, user]);

  // Document Title Change Handler
  const handleTitleChange = async (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSaveStatus("Saving...");

    if (socket && isConnected) {
      socket.emit("send-changes", {
        documentId,
        title: newTitle,
        content: editor?.getHTML() || "",
      });

      socket.emit("save-document", {
        documentId,
        title: newTitle,
        content: editor?.getHTML() || "",
      });
    }
  };

  // Zoom functionality (Ctrl + Scroll)
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault(); // Prevent browser native zoom
        setZoomLevel((prev) => {
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          return Math.max(0.5, Math.min(3, prev + delta));
        });
      }
    };
    
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  // Export Handlers
  const handleExportPDF = () => {
    const element = document.querySelector(".word-document-page");
    if (!element) return;
    const opt = {
      margin: 0.5,
      filename: `${title || "document"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleExportWord = () => {
    const html = editor?.getHTML() || "";
    const header =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export Word</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + html + footer;

    const source =
      "data:application/vnd.ms-word;charset=utf-8," +
      encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${title || "document"}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const handleExportMarkdown = () => {
    const textContent = editor?.getText() || "";
    const blob = new Blob([textContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title || "document"}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center transition-colors">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-3" />
        <p className="text-sm opacity-70">Opening workspace...</p>
      </div>
    );
  }

  const canEdit = userAccessLevel === "owner" || userAccessLevel === "editor";
  const typingList = Array.from(typingUsers);
  const lastModifier = docData?.lastModifiedBy?.name || docData?.owner?.name || "Someone";
  const lastModifiedTime = docData?.updatedAt
    ? formatDistanceToNow(new Date(docData.updatedAt), { addSuffix: true })
    : "recently";

  return (
    <div className="min-h-screen transition-colors flex flex-col">
      {/* Top Editor Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-700/50 px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Back, Document Title & Last Modifier Badge */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-xl opacity-70 hover:opacity-100 hover:bg-slate-800/30 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              {canEdit ? (
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Untitled Document"
                  className="bg-transparent font-bold text-lg hover:bg-slate-800/20 focus:bg-slate-800/40 px-2 py-0.5 rounded-xl border border-transparent focus:border-indigo-500/50 focus:outline-none transition-all"
                />
              ) : (
                <h1 className="font-bold text-lg px-2">{title}</h1>
              )}

              <Badge role={userAccessLevel} />

              {/* Auto Save Status */}
              <span className="hidden sm:flex items-center gap-1 text-xs opacity-80 glass-panel px-2.5 py-0.5 rounded-full font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                {saveStatus}
              </span>
            </div>

            {/* Last Modified By Indicator */}
            <p className="text-[11px] opacity-70 px-2 flex items-center gap-1.5 mt-0.5">
              <UserCheck className="w-3 h-3 text-indigo-500" />
              <span>
                Last edited by <strong className="font-semibold">{lastModifier}</strong> {lastModifiedTime}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Presence, Theme Toggle, Live Typing & Header Actions */}
        <div className="flex items-center gap-3">
          {/* Live Typing Preview Banner */}
          {typingList.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-3 py-1 rounded-full text-xs font-medium animate-pulse">
              <Edit3 className="w-3.5 h-3.5" />
              <span>{typingList.join(", ")} editing...</span>
            </div>
          )}

          <PresenceAvatars presenceList={presenceList} currentUserId={user?._id} />

          {/* Theme Switcher Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl glass-panel text-slate-300 hover:text-amber-400 transition-colors"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Share Button */}
          {canEdit && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsShareOpen(true)}
              className="shadow-lg shadow-indigo-600/20"
            >
              <Share2 className="w-4 h-4" /> Share
            </Button>
          )}

          {/* History Panel Toggle */}
          <button
            onClick={() => {
              setIsHistoryOpen(!isHistoryOpen);
              if (!isHistoryOpen) setIsCommentsOpen(false);
            }}
            className={`p-2 rounded-xl border transition-colors ${isHistoryOpen
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "glass-panel hover:bg-slate-800/30"
              }`}
            title="Version History"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Comments Panel Toggle */}
          <button
            onClick={() => {
              setIsCommentsOpen(!isCommentsOpen);
              if (!isCommentsOpen) setIsHistoryOpen(false);
            }}
            className={`p-2 rounded-xl border transition-colors ${isCommentsOpen
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "glass-panel hover:bg-slate-800/30"
              }`}
            title="Comments Thread"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Editor Formatting Toolbar */}
      <EditorToolbar
        editor={editor}
        onExportPDF={handleExportPDF}
        onExportWord={handleExportWord}
        onExportMarkdown={handleExportMarkdown}
      />

      {/* Split Workspace Layout */}
      <div className="flex-1 flex items-start justify-center gap-6 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* Main Partitioned Word-Style Sheet Canvas */}
        <main className="flex-1 flex flex-col items-center max-w-4xl w-full">
          {/* Static Banners Container */}
          <div className="w-full space-y-2 mb-3">
            {!canEdit && (
              <div className="w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Read-Only Mode. You have viewer permissions for this document.</span>
              </div>
            )}

            {typingList.length > 0 && (
              <div className="w-full md:hidden p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 animate-bounce" />
                <span>{typingList.join(", ")} editing...</span>
              </div>
            )}
          </div>

          {/* Image Floating Toolbar */}
          <ImageBubbleMenu editor={editor} onOpenCrop={(src) => setCropImageSrc(src)} />
          
          {/* Table Floating Toolbar */}
          <TableBubbleMenu editor={editor} />

          {/* Paginated Word Document Sheet */}
          <div 
            className="w-full flex justify-center transition-transform duration-100 ease-out origin-top"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <div className="word-document-page w-full min-h-[850px] rounded-2xl p-8 sm:p-12 transition-all">
              <MemoizedEditorContent editor={editor} />
            </div>
          </div>

        </main>

        {/* Image Crop Modal */}
        <ImageCropModal
          isOpen={!!cropImageSrc}
          onClose={() => setCropImageSrc(null)}
          imageSrc={cropImageSrc}
          onCropComplete={(base64) => {
            if (editor) {
              editor.chain().focus().setImage({ src: base64 }).run();
            }
            setCropImageSrc(null);
          }}
        />

        {/* Aligned Side Panels (Comments or Version History) */}
        <HistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          documentId={documentId}
          userAccessLevel={userAccessLevel}
          onRestoreSuccess={(restoredDoc) => {
            setDocData(restoredDoc);
            setTitle(restoredDoc.title || "Untitled Document");
            if (editor && restoredDoc.content !== undefined) {
              isRemoteChange.current = true;
              editor.commands.setContent(restoredDoc.content);
            }
            setSaveStatus("Saved");

            // Broadcast restored content over Socket.IO to all collaborators in room
            if (socket && isConnected) {
              socket.emit("send-changes", {
                documentId,
                content: restoredDoc.content,
                title: restoredDoc.title,
              });
            }
          }}
        />

        <CommentSidebar
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          documentId={documentId}
          currentUserId={user?._id}
          userAccessLevel={userAccessLevel}
        />
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        document={docData}
        onShare={async (shareData) => {
          const res = await docService.shareDocument(documentId, shareData);
          setDocData(res.document);
        }}
      />
    </div>
  );
};
