const Document = require("../models/Document");
const User = require("../models/User");

/**
 * @desc    Create a new document
 * @route   POST /api/documents
 * @access  Private
 */
const createDocument = async (req, res, next) => {
  try {
    const { title } = req.body;

    const document = await Document.create({
      title: title || "Untitled Document",
      owner: req.user._id,
      lastModifiedBy: req.user._id,
      content: "<p></p>",
    });

    await document.populate("owner", "name email avatar");

    return res.status(201).json({
      success: true,
      message: "Document created successfully",
      document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's accessible documents (Owned & Shared with Me)
 * @route   GET /api/documents
 * @access  Private
 */
const getDocuments = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { search } = req.query;

    const filter = {
      $or: [
        { owner: userId },
        { "collaborators.user": userId },
      ],
    };

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const docs = await Document.find(filter)
      .populate("owner", "name email avatar")
      .populate("collaborators.user", "name email avatar")
      .sort({ updatedAt: -1 });

    const owned = docs.filter(
      (d) => d.owner && d.owner._id.toString() === userId.toString()
    );
    const shared = docs.filter(
      (d) => d.owner && d.owner._id.toString() !== userId.toString()
    );

    return res.status(200).json({
      success: true,
      all: docs,
      owned,
      shared,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single document details & auto-add to user's list when opened via link
 * @route   GET /api/documents/:id
 * @access  Private
 */
const getDocumentById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const document = req.doc;

    const isOwner = document.owner._id.toString() === userId.toString();
    const isCollaborator = document.collaborators.some(
      (c) => c.user && c.user._id.toString() === userId.toString()
    );

    // If opened by another logged-in user via link (and document is public or accessible),
    // auto-add user to collaborators so document appears in their "Shared with Me" dashboard list!
    if (!isOwner && !isCollaborator && document.isPublic) {
      document.collaborators.push({
        user: userId,
        role: document.publicRole || "viewer",
      });
      await document.save();
      await document.populate("collaborators.user", "name email avatar");
    }

    const userAccessLevel = document.getUserAccessLevel(userId);

    return res.status(200).json({
      success: true,
      document,
      userAccessLevel,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Share document / update collaborator permission role or public settings
 * @route   POST /api/documents/:id/share
 * @access  Private (Owner / Editor)
 */
const shareDocument = async (req, res, next) => {
  try {
    const { email, role, isPublic, publicRole } = req.body;
    const document = req.doc;

    if (isPublic !== undefined) {
      document.isPublic = Boolean(isPublic);
    }
    if (publicRole) {
      document.publicRole = publicRole;
    }

    if (email) {
      const targetUser = await User.findOne({ email: email.toLowerCase() });
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "User with this email was not found",
        });
      }

      if (targetUser._id.toString() === document.owner._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Cannot add document owner as a collaborator",
        });
      }

      const existingCollabIndex = document.collaborators.findIndex(
        (c) => c.user && c.user._id.toString() === targetUser._id.toString()
      );

      if (existingCollabIndex > -1) {
        // Change/Alter existing collaborator permission role (viewer <-> commenter <-> editor)
        document.collaborators[existingCollabIndex].role = role || "editor";
      } else {
        // Invite new collaborator
        document.collaborators.push({
          user: targetUser._id,
          role: role || "editor",
        });
      }
    }

    await document.save();
    await document.populate("owner", "name email avatar");
    await document.populate("collaborators.user", "name email avatar");

    return res.status(200).json({
      success: true,
      message: "Sharing permissions updated successfully",
      document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove collaborator access
 * @route   DELETE /api/documents/:id/share/:userId
 * @access  Private (Owner only)
 */
const removeCollaborator = async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const document = req.doc;

    document.collaborators = document.collaborators.filter(
      (c) => c.user && c.user._id.toString() !== targetUserId
    );

    await document.save();
    await document.populate("owner", "name email avatar");
    await document.populate("collaborators.user", "name email avatar");

    return res.status(200).json({
      success: true,
      message: "Collaborator access removed",
      document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Duplicate document
 * @route   POST /api/documents/:id/duplicate
 * @access  Private
 */
const duplicateDocument = async (req, res, next) => {
  try {
    const originalDoc = req.doc;

    const duplicatedDoc = await Document.create({
      title: `${originalDoc.title} (Copy)`,
      content: originalDoc.content,
      owner: req.user._id,
      lastModifiedBy: req.user._id,
      isPublic: false,
    });

    await duplicatedDoc.populate("owner", "name email avatar");

    return res.status(201).json({
      success: true,
      message: "Document duplicated successfully",
      document: duplicatedDoc,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete document
 * @route   DELETE /api/documents/:id
 * @access  Private (Owner only)
 */
const deleteDocument = async (req, res, next) => {
  try {
    const document = req.doc;

    if (document.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the document owner can delete this document",
      });
    }

    await Document.findByIdAndDelete(document._id);

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  shareDocument,
  removeCollaborator,
  duplicateDocument,
  deleteDocument,
};
