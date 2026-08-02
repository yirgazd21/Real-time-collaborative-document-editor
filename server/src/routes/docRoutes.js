const express = require("express");
const router = express.Router();
const {
  createDocument,
  getDocuments,
  getDocumentById,
  duplicateDocument,
  deleteDocument,
  shareDocument,
  removeCollaborator,
} = require("../controllers/docController");

const { protect } = require("../middlewares/authMiddleware");
const { requireDocAccess } = require("../middlewares/accessMiddleware");

// All document routes require authentication
router.use(protect);

// Root Document Endpoints
router.route("/").post(createDocument).get(getDocuments);

// Specific Document Endpoints (Role-Protected)
router
  .route("/:id")
  .get(requireDocAccess("viewer"), getDocumentById)
  .delete(requireDocAccess("owner"), deleteDocument);

// Duplication & Sharing Endpoints
router.post("/:id/duplicate", requireDocAccess("viewer"), duplicateDocument);
router.post("/:id/share", requireDocAccess("editor"), shareDocument);
router.delete(
  "/:id/share/:targetUserId",
  requireDocAccess("owner"),
  removeCollaborator
);

module.exports = router;
