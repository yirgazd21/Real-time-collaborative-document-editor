const mongoose = require("mongoose");

const revisionSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    title: {
      type: String,
      default: "Untitled Document",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    versionName: {
      type: String,
      default: "Auto-saved Revision",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for querying revisions sorted by creation time
revisionSchema.index({ documentId: 1, createdAt: -1 });

const Revision = mongoose.model("Revision", revisionSchema);

module.exports = Revision;
