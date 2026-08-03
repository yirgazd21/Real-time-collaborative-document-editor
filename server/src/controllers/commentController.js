const Comment = require("../models/Comment");

/**
 * Helper to broadcast comment update event over Socket.IO
 */
const broadcastCommentUpdate = (req, documentId) => {
  const io = req.app.get("io");
  if (io && documentId) {
    io.to(`document:${documentId}`).emit("comment-updated");
  }
};

/**
 * @desc    Add a comment to a document
 * @route   POST /api/documents/:docId/comments
 * @access  Private (Commenter+)
 */
const addComment = async (req, res, next) => {
  try {
    const document = req.document || req.doc;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content cannot be empty",
      });
    }

    const comment = await Comment.create({
      documentId: document._id,
      author: req.user._id,
      content: content.trim(),
    });

    await comment.populate("author", "name email avatar");

    broadcastCommentUpdate(req, document._id);

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get comments for a document
 * @route   GET /api/documents/:docId/comments
 * @access  Private (Viewer+)
 */
const getComments = async (req, res, next) => {
  try {
    const document = req.document || req.doc;

    const comments = await Comment.find({ documentId: document._id })
      .populate("author", "name email avatar")
      .populate("replies.author", "name email avatar")
      .populate("resolvedBy", "name email avatar")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update / Edit an existing comment
 * @route   PUT /api/documents/:docId/comments/:commentId
 * @access  Private (Comment Author only)
 */
const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content cannot be empty",
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own comments",
      });
    }

    comment.content = content.trim();
    await comment.save();
    await comment.populate("author", "name email avatar");

    broadcastCommentUpdate(req, comment.documentId);

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a reply to a comment thread
 * @route   POST /api/documents/:docId/comments/:commentId/reply
 * @access  Private (Commenter+)
 */
const addReply = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply content cannot be empty",
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    comment.replies.push({
      author: req.user._id,
      content: content.trim(),
    });

    await comment.save();
    await comment.populate("author", "name email avatar");
    await comment.populate("replies.author", "name email avatar");

    broadcastCommentUpdate(req, comment.documentId);

    return res.status(200).json({
      success: true,
      message: "Reply added successfully",
      comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle resolve / reopen status on a comment thread
 * @route   PATCH /api/documents/:docId/comments/:commentId/resolve
 * @access  Private (Commenter+)
 */
const toggleResolveComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    comment.isResolved = !comment.isResolved;
    comment.resolvedBy = comment.isResolved ? req.user._id : null;

    await comment.save();
    await comment.populate("author", "name email avatar");
    await comment.populate("resolvedBy", "name email avatar");

    broadcastCommentUpdate(req, comment.documentId);

    return res.status(200).json({
      success: true,
      message: comment.isResolved ? "Comment resolved" : "Comment reopened",
      comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a comment thread
 * @route   DELETE /api/documents/:docId/comments/:commentId
 * @access  Private (Comment Author or Document Owner)
 */
const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const document = req.document || req.doc;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isDocOwner = document.owner._id.toString() === req.user._id.toString();

    if (!isAuthor && !isDocOwner) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this comment",
      });
    }

    await Comment.findByIdAndDelete(commentId);

    broadcastCommentUpdate(req, document._id);

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a specific reply from a comment thread
 * @route   DELETE /api/documents/:docId/comments/:commentId/replies/:replyId
 * @access  Private (Reply Author or Document Owner)
 */
const deleteReply = async (req, res, next) => {
  try {
    const { commentId, replyId } = req.params;
    const document = req.document || req.doc;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment thread not found",
      });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    const isReplyAuthor = reply.author.toString() === req.user._id.toString();
    const isDocOwner = document.owner._id.toString() === req.user._id.toString();

    if (!isReplyAuthor && !isDocOwner) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own replies",
      });
    }

    comment.replies.pull(replyId);
    await comment.save();
    await comment.populate("author", "name email avatar");
    await comment.populate("replies.author", "name email avatar");

    broadcastCommentUpdate(req, document._id);

    return res.status(200).json({
      success: true,
      message: "Reply deleted successfully",
      comment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addComment,
  getComments,
  updateComment,
  addReply,
  toggleResolveComment,
  deleteComment,
  deleteReply,
};

