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
  const [newCommentContent, setNewCommentContent] = useState("");
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
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

  // Real-Time Socket Subscription for Instant Live Comment Updates
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
      fetchComments();
      notifyCommentChange();
    } catch (err) {
      console.error("Failed to add reply:", err);
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

  return (
    <aside className="w-80 lg:w-96 flex-shrink-0 glass-panel rounded-3xl border border-slate-700/50 shadow-2xl p-5 flex flex-col justify-between transition-colors animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-semibold">Comments ({comments.length})</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-slate-800/30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comment Threads */}
        <div className="flex-1 overflow-y-auto my-3 space-y-3.5 pr-1">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div
                key={comment._id}
                className={`p-3.5 rounded-2xl border transition-all glass-panel ${
                  comment.isResolved ? "opacity-60" : ""
                }`}
              >
                {/* Author Info & Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={comment.author?.name}
                      src={comment.author?.avatar}
                      size="sm"
                    />
                    <div>
                      <p className="text-xs font-semibold">{comment.author?.name}</p>
                      <p className="text-[10px] opacity-60 font-mono">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {canComment && (
                      <button
                        onClick={() => handleToggleResolve(comment._id)}
                        className={`p-1 rounded-lg transition-colors ${
                          comment.isResolved
                            ? "text-emerald-500 bg-emerald-500/10"
                            : "opacity-60 hover:opacity-100 hover:bg-slate-800/20"
                        }`}
                        title={comment.isResolved ? "Reopen Thread" : "Mark as Resolved"}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    {comment.author?._id === currentUserId && (
                      <button
                        onClick={() => {
                          setEditingCommentId(comment._id);
                          setEditContent(comment.content);
                        }}
                        className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:text-indigo-500 transition-colors"
                        title="Edit Comment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {(comment.author?._id === currentUserId ||
                      userAccessLevel === "owner") && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:text-rose-500 transition-colors"
                        title="Delete Thread"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content / Edit Form */}
                {editingCommentId === comment._id ? (
                  <div className="mt-2.5 space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full glass-panel rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      rows={2}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="px-2.5 py-1 text-xs opacity-70 hover:opacity-100"
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
                  <p className="text-xs mt-2 leading-relaxed opacity-90">
                    {comment.content}
                  </p>
                )}

                {/* Replies */}
                {comment.replies?.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-700/40 space-y-2 pl-2">
                    {comment.replies.map((reply, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <CornerDownRight className="w-3 h-3 opacity-50 shrink-0 mt-0.5" />
                        <div className="flex-1 glass-panel p-2 rounded-xl border border-slate-700/30">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-indigo-500 text-[11px]">
                              {reply.author?.name}
                            </span>
                            <span className="text-[9px] opacity-60 font-mono">
                              {formatDistanceToNow(new Date(reply.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px]">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Button / Form */}
                {canComment && !comment.isResolved && (
                  <div className="mt-2">
                    {replyingToId === comment._id ? (
                      <div className="flex gap-1.5 mt-2">
                        <input
                          type="text"
                          autoFocus
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 glass-panel rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddReply(comment._id)}
                        >
                          Reply
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setReplyingToId(comment._id);
                          setReplyContent("");
                        }}
                        className="text-[11px] font-semibold text-indigo-500 hover:underline transition-colors mt-1"
                      >
                        + Reply
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-xs opacity-60 py-10">
              No comments added yet. Be the first to leave a comment!
            </p>
          )}
        </div>

        {/* New Comment Input */}
        {canComment && (
          <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-700/50 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="Add a comment to document..."
                className="flex-1 glass-panel rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <Button type="submit" size="md">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </aside>
  );
};
