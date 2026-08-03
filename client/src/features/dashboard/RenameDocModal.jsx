import React, { useState, useEffect } from "react";
import { Modal } from "../../components/common/Modal";
import { Button } from "../../components/common/Button";
import { Edit3 } from "lucide-react";

export const RenameDocModal = ({ isOpen, onClose, document, onRename }) => {
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (document) {
      setTitle(document.title || "");
    }
  }, [document]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!document || !title.trim()) return;

    setIsLoading(true);
    try {
      await onRename(document._id, title.trim());
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rename Document">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-black dark:text-white uppercase tracking-wider mb-2">
            New Document Title
          </label>
          <div className="relative">
            <Edit3 className="absolute left-3.5 top-3 w-4 h-4 text-black" />
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter new title..."
              className="w-full bg-black text-white border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={!title.trim()}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
