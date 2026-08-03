import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../components/common/Modal";
import { Button } from "../../components/common/Button";
import { ExternalLink, Link2 } from "lucide-react";

export const OpenDocModal = ({ isOpen, onClose }) => {
  const [docInput, setDocInput] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleOpen = (e) => {
    e.preventDefault();
    setError("");

    const trimmed = docInput.trim();
    if (!trimmed) {
      setError("Please enter a document ID or URL");
      return;
    }

    // Extract Mongo ID if a full URL was pasted (e.g., http://.../document/65a...)
    let docId = trimmed;
    if (trimmed.includes("/document/")) {
      const parts = trimmed.split("/document/");
      docId = parts[parts.length - 1].split("?")[0].split("#")[0];
    }

    if (!docId) {
      setError("Invalid document ID or link");
      return;
    }

    setDocInput("");
    onClose();
    navigate(`/document/${docId}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Open Existing Document">
      <form onSubmit={handleOpen} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Document ID or Link
          </label>
          <div className="relative">
            <Link2 className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              autoFocus
              value={docInput}
              onChange={(e) => {
                setDocInput(e.target.value);
                setError("");
              }}
              placeholder="e.g. 67a1b2c3... or paste full link"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!docInput.trim()}
          >
            <ExternalLink className="w-4 h-4" /> Open Document
          </Button>
        </div>
      </form>
    </Modal>
  );
};
