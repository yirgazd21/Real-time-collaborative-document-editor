const mongoose = require("mongoose");

const collaboratorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["viewer", "commenter", "editor"],
      default: "viewer",
    },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
      default: "Untitled Document",
    },
    content: {
      type: mongoose.Schema.Types.Mixed, // Stores JSON delta / HTML / rich text tree
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    collaborators: [collaboratorSchema],
    isPublic: {
      type: Boolean,
      default: false,
    },
    publicRole: {
      type: String,
      enum: ["viewer", "commenter", "editor"],
      default: "viewer",
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

// Index for text search on title
documentSchema.index({ title: "text" });

// Helper instance method to check user access level
documentSchema.methods.getUserAccessLevel = function (userId) {
  if (!userId) {
    return this.isPublic ? this.publicRole : null;
  }

  const userIdStr = userId.toString();

  // Safely extract owner ID whether populated or unpopulated ObjectId
  const ownerIdStr = this.owner?._id
    ? this.owner._id.toString()
    : this.owner?.toString();

  if (ownerIdStr === userIdStr) {
    return "owner";
  }

  // Check collaborator list safely whether populated or unpopulated
  const collaborator = this.collaborators.find((c) => {
    const collabIdStr = c.user?._id
      ? c.user._id.toString()
      : c.user?.toString();
    return collabIdStr === userIdStr;
  });

  if (collaborator) {
    return collaborator.role;
  }

  // Fallback to public access role if enabled
  if (this.isPublic) {
    return this.publicRole || "viewer";
  }

  return null;
};

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;
