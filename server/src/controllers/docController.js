const Document = require("../models/Document");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

/**
 * @desc    Create a new document
 * @route   POST /api/documents
 * @access  Private
 */
const createDocument = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    const document = await Document.create({
      title: title || "Untitled Document",
      owner: req.user._id,
      lastModifiedBy: req.user._id,
      content: content || "<p></p>",
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
    const userEmail = req.user.email?.toLowerCase().trim();
    const { search } = req.query;

    // Auto-claim any pending invites for this user's email
    if (userEmail) {
      const pendingDocs = await Document.find({
        "pendingInvites.email": userEmail,
      });
      for (const pDoc of pendingDocs) {
        const pMatch = pDoc.pendingInvites.find(
          (pi) => pi.email && pi.email.toLowerCase() === userEmail
        );
        if (pMatch) {
          pDoc.collaborators.push({ user: userId, role: pMatch.role });
          pDoc.pendingInvites = pDoc.pendingInvites.filter(
            (pi) => pi.email.toLowerCase() !== userEmail
          );
          await pDoc.save({ validateBeforeSave: false });
        }
      }
    }

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

    // If opened by another logged-in user via link, auto-add user as collaborator with editor access
    if (!isOwner && !isCollaborator) {
      document.collaborators.push({
        user: userId,
        role: document.publicRole || "editor",
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

    let invitedEmail = null;

    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      const targetUser = await User.findOne({ email: cleanEmail });

      if (targetUser) {
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
          document.collaborators[existingCollabIndex].role = role || "editor";
        } else {
          document.collaborators.push({
            user: targetUser._id,
            role: role || "editor",
          });
        }
      } else {
        // User not registered yet — add to pendingInvites
        if (!document.pendingInvites) {
          document.pendingInvites = [];
        }
        const existingPendingIndex = document.pendingInvites.findIndex(
          (p) => p.email && p.email.toLowerCase() === cleanEmail
        );
        if (existingPendingIndex > -1) {
          document.pendingInvites[existingPendingIndex].role = role || "editor";
        } else {
          document.pendingInvites.push({
            email: cleanEmail,
            role: role || "editor",
          });
        }
      }
      invitedEmail = cleanEmail;
    }

    await document.save();
    await document.populate("owner", "name email avatar");
    await document.populate("collaborators.user", "name email avatar");

    // Non-blocking asynchronous email dispatch
    if (invitedEmail) {
      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      const docUrl = `${clientUrl}/document/${document._id}`;
      const senderName = req.user.name || "A collaborator";

      sendEmail({
        email: invitedEmail,
        subject: `SyncWrite - ${senderName} shared a document with you`,
        message: `${senderName} shared "${document.title}" with you as ${role || "editor"}. Access it here: ${docUrl}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #6366f1; font-size: 24px; margin: 0;">SyncWrite Collab</h2>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Document Sharing Invitation</p>
            </div>
            <p style="color: #1e293b; font-size: 15px; line-height: 1.5;">Hello,</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;"><strong>${senderName}</strong> has shared the document <strong>"${document.title}"</strong> with you as <strong>${role || "editor"}</strong>.</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${docUrl}" style="background-color: #6366f1; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">Open Document</a>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Click the link above to register or sign in with Google to view and edit this document.</p>
            <p style="word-break: break-all; font-size: 12px; color: #6366f1;">${docUrl}</p>
          </div>
        `,
      }).catch((emailErr) =>
        console.error("Document share email error:", emailErr.message)
      );
    }

    return res.status(200).json({
      success: true,
      message: "Invitation sent successfully!",
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

/**
 * @desc    Rename document
 * @route   PATCH /api/documents/:id/rename
 * @access  Private (Owner / Editor)
 */
const renameDocument = async (req, res, next) => {
  try {
    const { title } = req.body;
    const document = req.doc;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Document title cannot be empty",
      });
    }

    document.title = title.trim();
    document.lastModifiedBy = req.user._id;

    await document.save();
    await document.populate("owner", "name email avatar");
    await document.populate("collaborators.user", "name email avatar");

    return res.status(200).json({
      success: true,
      message: "Document renamed successfully",
      document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update document title or content via REST API
 * @route   PUT /api/documents/:id
 * @access  Private (Owner / Editor)
 */
const updateDocument = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const document = req.doc;

    if (title !== undefined) document.title = title;
    if (content !== undefined) document.content = content;
    document.lastModifiedBy = req.user._id;

    await document.save();
    await document.populate("lastModifiedBy", "name email avatar");

    return res.status(200).json({
      success: true,
      message: "Document updated successfully",
      document,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  shareDocument,
  removeCollaborator,
  duplicateDocument,
  deleteDocument,
  renameDocument,
};

