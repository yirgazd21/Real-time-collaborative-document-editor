const Revision = require("../models/Revision");
const Document = require("../models/Document");

/**
 * @desc    Create a new revision snapshot for a document
 * @route   POST /api/documents/:docId/revisions
 * @access  Private (Editor+)
 */
const createRevision = async (req, res, next) => {
  try {
    const document = req.document;
    const { versionName } = req.body;

    const revision = await Revision.create({
      documentId: document._id,
      content: document.content,
      title: document.title,
      createdBy: req.user._id,
      versionName: versionName || "Manual Snapshot",
    });

    await revision.populate("createdBy", "name email avatar");

    return res.status(201).json({
      success: true,
      message: "Revision snapshot created successfully",
      revision,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get version history for a document
 * @route   GET /api/documents/:docId/revisions
 * @access  Private (Viewer+)
 */
const getRevisions = async (req, res, next) => {
  try {
    const document = req.document;

    const revisions = await Revision.find({ documentId: document._id })
      .populate("createdBy", "name email avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: revisions.length,
      revisions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Restore a document to an earlier revision
 * @route   POST /api/documents/:docId/revisions/:revisionId/restore
 * @access  Private (Editor+)
 */
const restoreRevision = async (req, res, next) => {
  try {
    const document = req.document;
    const { revisionId } = req.params;

    const targetRevision = await Revision.findById(revisionId);

    if (
      !targetRevision ||
      targetRevision.documentId.toString() !== document._id.toString()
    ) {
      return res.status(404).json({
        success: false,
        message: "Target revision not found for this document",
      });
    }

    // Save current document state as a revision safeguard before restoring
    await Revision.create({
      documentId: document._id,
      content: document.content,
      title: document.title,
      createdBy: req.user._id,
      versionName: `State prior to restoring: ${targetRevision.versionName}`,
    });

    // Update document with restored content and title
    document.content = targetRevision.content;
    document.title = targetRevision.title;
    document.lastModifiedBy = req.user._id;

    await document.save();
    await document.populate("owner", "name email avatar");
    await document.populate("lastModifiedBy", "name email avatar");

    return res.status(200).json({
      success: true,
      message: `Restored version '${targetRevision.versionName}' successfully`,
      document,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRevision,
  getRevisions,
  restoreRevision,
};
