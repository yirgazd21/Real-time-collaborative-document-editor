import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { commentService } from "../../services/commentService";
import { useSocket } from "../../context/SocketContext";
import { Avatar } from "../../components/common/Avatar";
import { Button } from "../../components/common/Button";
import {
  MessageSquare,
  X,
  Send,
  CheckCircle2,
  Trash2,
  CornerDownRight,
  Edit2,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export const CommentSidebar = ({
  isOpen,
  onClose,
  documentId,
  currentUserId,
  userAccessLevel,
}) => {
  const { socket, isConnected } = useSocket();
  const [comments, setComments] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all' | 'open' | 'resolved'
  const [newCommentContent, setNewCommentContent] = useState("");
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState({}); // commentId -> boolean
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const data = await commentService.getComments(documentId);
      setComments(data.comments || []);
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, documentId]);

  useEffect(() => {
    if (!socket || !isConnected || !documentId) return;

    const handleCommentUpdated = () => {
      fetchComments();
    };

    socket.on("comment-updated", handleCommentUpdated);

    return () => {
      socket.off("comment-updated", handleCommentUpdated);
    };
  }, [socket, isConnected, documentId]);

  const notifyCommentChange = () => {
    if (socket && isConnected && documentId) {
      socket.emit("comment-action", { documentId });
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentContent.trim()) return;
    try {
      await commentService.addComment(documentId, newCommentContent.trim());
      setNewCommentContent("");
      fetchComments();
      notifyCommentChange();
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      await commentService.updateComment(documentId, commentId, editContent.trim());
      setEditingCommentId(null);
      setEditContent("");
      fetchComments();
      notifyCommentChange();
    } catch (err) {
      console.error("Failed to update comment:", err);
    }
  };

  const handleAddReply = async (commentId) => {
    if (!replyContent.trim()) return;
    try {
      await commentService.addReply(documentId, commentId, replyContent.trim());
      setReplyingToId(null);
      setReplyContent("");
      setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
      fetchComments();
      notifyCommentChange();
    } catch (err) {
      console.error("Failed to add reply:", err);
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    if (window.confirm("Are you sure you want to delete this reply?")) {
      try {
        await commentService.deleteReply(documentId, commentId, replyId);
        fetchComments();
        notifyCommentChange();
      } catch (err) {
        console.error("Failed to delete reply:", err);
      }
    }
  };

  const handleToggleResolve = async (commentId) => {
    try {
      await commentService.toggleResolve(documentId, commentId);
      fetchComments();
      notifyCommentChange();
    } catch (err) {
      console.error("Failed to toggle resolve:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment thread?")) {
      try {
        await commentService.deleteComment(documentId, commentId);
        fetchComments();
        notifyCommentChange();
      } catch (err) {
        console.error("Failed to delete comment:", err);
      }
    }
  };

  if (!isOpen) return null;

  const canComment =
    userAccessLevel === "owner" ||
    userAccessLevel === "editor" ||
    userAccessLevel === "commenter";

  const displayedComments = comments.filter((c) => {
    if (filter === "open") return !c.isResolved;
    if (filter === "resolved") return c.isResolved;
    return true;
  });

  return (
    <aside className="w-80 lg:w-96 flex-shrink-0 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between transition-colors animate-in fade-in slide-in-from-right-4 duration-200 text-slate-900 dark:text-white">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Comments ({comments.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mt-3 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              filter === "all"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white"
            }`}
          >
            All ({comments.length})
          </button>
          <button
            onClick={() => setFilter("open")}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              filter === "open"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white"
            }`}
          >
            Open ({comments.filter((c) => !c.isResolved).length})
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              filter === "resolved"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white"
            }`}
          >
            Resolved ({comments.filter((c) => c.isResolved).length})
          </button>
        </div>

        {/* Comment Threads List */}
        <div className="flex-1 overflow-y-auto my-3 space-y-3.5 pr-1">
          {displayedComments.length > 0 ? (
            displayedComments.map((comment) => {
              const hasReplies = comment.replies?.length > 0;
              const isExpanded = Boolean(expandedReplies[comment._id]);

              return (
                <div
                  key={comment._id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    comment.isResolved
                      ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-indigo-500"
                  }`}
                >
                  {/* Author Info & Action Icons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={comment.author?.name}
                        src={comment.author?.avatar}
                        size="sm"
                      />
                      <div>
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {comment.author?.name}
                        </p>
                        <p className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Resolve Toggle Button */}
                      {canComment && (
                        <button
                          onClick={() => handleToggleResolve(comment._id)}
                          className={`p-1.5 rounded-lg font-bold transition-colors ${
                            comment.isResolved
                              ? "text-white bg-emerald-600"
                              : "text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white"
                          }`}
                          title={comment.isResolved ? "Reopen Thread" : "Resolve Comment Thread"}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Edit Button */}
                      {comment.author?._id === currentUserId && (
                        <button
                          onClick={() => {
                            setEditingCommentId(comment._id);
                            setEditContent(comment.content);
                          }}
                          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors"
                          title="Edit Comment"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete Button */}
                      {(comment.author?._id === currentUserId ||
                        userAccessLevel === "owner") && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-rose-600 hover:text-white transition-colors"
                          title="Delete Thread"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comment Content / Edit Form */}
                  {editingCommentId === comment._id ? (
                    <div className="mt-2.5 space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        rows={2}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingCommentId(null)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:underline"
                        >
                          Cancel
                        </button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateComment(comment._id)}
                        >
                          <Check className="w-3.5 h-3.5" /> Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-bold mt-2.5 leading-relaxed text-slate-900 dark:text-slate-100">
                      {comment.content}
                    </p>
                  )}

                  {/* Resolved Banner */}
                  {comment.isResolved && (
                    <div className="mt-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolved by {comment.resolvedBy?.name || "User"}</span>
                    </div>
                  )}

                  {/* Expand / Hide Replies Toggle Button */}
                  {hasReplies && (
                    <button
                      onClick={() => toggleReplies(comment._id)}
                      className="mt-2.5 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Hide Replies ({comment.replies.length})</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>Show Replies ({comment.replies.length})</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Replies Thread List */}
                  {hasReplies && isExpanded && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 pl-2 animate-in fade-in duration-200">
                      {comment.replies.map((reply) => (
                        <div key={reply._id} className="flex items-start gap-2 text-xs group/reply">
                          <CornerDownRight className="w-3 h-3 text-slate-400 shrink-0 mt-1" />
                          <div className="flex-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Avatar
                                  name={reply.author?.name}
                                  src={reply.author?.avatar}
                                  size="xs"
                                />
                                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-[11px]">
                                  {reply.author?.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                                  {formatDistanceToNow(new Date(reply.createdAt), {
                                    addSuffix: true,
                                  })}
                                </span>

                                {(reply.author?._id === currentUserId ||
                                  userAccessLevel === "owner") && (
                                  <button
                                    onClick={() => handleDeleteReply(comment._id, reply._id)}
                                    className="opacity-0 group-hover/reply:opacity-100 p-0.5 rounded text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                                    title="Delete Reply"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="mt-1 text-[11px] font-bold text-slate-900 dark:text-slate-100">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Action Form */}
                  {canComment && !comment.isResolved && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                      {replyingToId === comment._id ? (
                        <div className="space-y-2 mt-1">
                          <input
                            type="text"
                            autoFocus
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingToId(null);
                                setReplyContent("");
                              }}
                              className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:underline px-2 py-1"
                            >
                              Cancel
                            </button>
                            <Button
                              size="sm"
                              onClick={() => handleAddReply(comment._id)}
                              disabled={!replyContent.trim()}
                            >
                              Reply
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setReplyingToId(comment._id);
                            setReplyContent("");
                          }}
                          className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
                        >
                          + Reply
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-center text-xs font-bold text-slate-500 py-10">
              {filter === "all"
                ? "No comments added yet."
                : `No ${filter} comments.`}
            </p>
          )}
        </div>

        {/* New Comment Input */}
        {canComment && (
          <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="Add a comment to document..."
                className="flex-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <Button type="submit" size="md" disabled={!newCommentContent.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </aside>
  );
};
