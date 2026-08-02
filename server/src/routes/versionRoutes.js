const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  createRevision,
  getRevisions,
  restoreRevision,
} = require("../controllers/versionController");

const { protect } = require("../middlewares/authMiddleware");
const { requireDocAccess } = require("../middlewares/accessMiddleware");

// All version routes require authentication
router.use(protect);

// Revisions Endpoints
router
  .route("/")
  .post(requireDocAccess("editor"), createRevision)
  .get(requireDocAccess("viewer"), getRevisions);

router.post(
  "/:revisionId/restore",
  requireDocAccess("editor"),
  restoreRevision
);

module.exports = router;
