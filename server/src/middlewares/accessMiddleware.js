const mongoose = require("mongoose");
const Document = require("../models/Document");

const ROLE_HIERARCHY = {
  viewer: 1,
  commenter: 2,
  editor: 3,
  owner: 4,
};

/**
 * Middleware generator to enforce document access permissions based on role hierarchy.
 * @param {string} requiredRole - Minimal required role ('viewer', 'commenter', 'editor', 'owner')
 */
const requireDocAccess = (requiredRole = "viewer") => {
  return async (req, res, next) => {
    try {
      const docId = req.params.id || req.params.docId || req.body.documentId;

      if (!docId || !mongoose.Types.ObjectId.isValid(docId)) {
        return res.status(400).json({
          success: false,
          message: "Valid Document ID is required",
        });
      }

      const document = await Document.findById(docId)
        .populate("owner", "name email avatar")
        .populate("collaborators.user", "name email avatar");

      if (!document) {
        return res.status(404).json({
          success: false,
          message: "Document not found",
        });
      }

      const userId = req.user ? req.user._id : null;
      const userRole = document.getUserAccessLevel(userId);

      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You do not have access to this document.",
        });
      }

      const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;
      const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 1;

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({
          success: false,
          message: `Forbidden. You require '${requiredRole}' permissions for this operation. Your role is '${userRole}'.`,
        });
      }

      // Attach document and access level to request object
      req.doc = document;
      req.document = document;
      req.userAccessLevel = userRole;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error verifying document access",
        error: error.message,
      });
    }
  };
};

module.exports = {
  requireDocAccess,
  ROLE_HIERARCHY,
};
