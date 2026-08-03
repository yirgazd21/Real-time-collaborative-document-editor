const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  addComment,
  getComments,
  updateComment,
  addReply,
  toggleResolveComment,
  deleteComment,
  deleteReply,
} = require("../controllers/commentController");

const { protect } = require("../middlewares/authMiddleware");
const { requireDocAccess } = require("../middlewares/accessMiddleware");

// All comment routes require authentication
router.use(protect);

// Root Document Comments Endpoints
router
  .route("/")
  .post(requireDocAccess("commenter"), addComment)
  .get(requireDocAccess("viewer"), getComments);

// Comment Edit, Reply, Resolution & Deletion Endpoints
router.put(
  "/:commentId",
  requireDocAccess("commenter"),
  updateComment
);

router.post(
  "/:commentId/reply",
  requireDocAccess("commenter"),
  addReply
);

router.delete(
  "/:commentId/replies/:replyId",
  requireDocAccess("commenter"),
  deleteReply
);

router.patch(
  "/:commentId/resolve",
  requireDocAccess("commenter"),
  toggleResolveComment
);

router.delete(
  "/:commentId",
  requireDocAccess("commenter"),
  deleteComment
);

module.exports = router;
