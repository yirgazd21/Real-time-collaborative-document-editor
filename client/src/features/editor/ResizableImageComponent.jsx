import React, { useState, useRef, useEffect } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Scissors,
  Copy,
  RotateCcw,
  Maximize2,
} from "lucide-react";

export const ResizableImageComponent = ({ node, updateAttributes, selected, deleteNode }) => {
  const [resizing, setResizing] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);

  const imageRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const width = node.attrs.width || "100%";

  // Right Click Context Menu Handler
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu(true);
  };

  // Close Context Menu on Click Outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowContextMenu(false);
    };
    if (showContextMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showContextMenu]);

  // Drag-to-Resize Handler (Moving cursor outward/inward updates width in px)
  const handleMouseDown = (e, corner) => {
    e.preventDefault();
    e.stopPropagation();

    setResizing(true);
    startXRef.current = e.clientX;

    if (imageRef.current) {
      startWidthRef.current = imageRef.current.offsetWidth;
    }

    const handleMouseMove = (moveEvent) => {
      let deltaX = moveEvent.clientX - startXRef.current;
      if (corner.includes("left")) {
        deltaX = -deltaX;
      }

      // Moving cursor outward increases width in px, inward decreases width in px
      const newWidthPx = Math.max(80, Math.min(794, startWidthRef.current + deltaX));
      updateAttributes({ width: `${newWidthPx}px` });
    };

    const handleMouseUp = () => {
      setResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <NodeViewWrapper className="inline-block relative max-w-full my-3 select-none">
      <div
        className={`relative inline-block border-2 transition-all ${
          selected || resizing ? "border-indigo-500 rounded-lg shadow-xl" : "border-transparent"
        }`}
        onContextMenu={handleContextMenu}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          style={{ width: width, maxWidth: "100%", height: "auto" }}
          className="rounded block"
        />

        {/* Selected Image Border Handles & Dimension Label */}
        {(selected || resizing) && (
          <>
            {/* Dimension Indicator Badge */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[10px] font-mono px-2.5 py-0.5 rounded-full shadow-lg border border-slate-700 backdrop-blur pointer-events-none z-30 flex items-center gap-1">
              <span>{imageRef.current ? `${imageRef.current.offsetWidth}px` : width}</span>
            </div>

            {/* Top-Left Border Drag Handle */}
            <div
              onMouseDown={(e) => handleMouseDown(e, "top-left")}
              className="absolute -top-2 -left-2 w-4 h-4 bg-indigo-600 border-2 border-white rounded-full cursor-nwse-resize shadow-xl hover:scale-125 transition-transform z-30"
              title="Move cursor in/out to resize image (px)"
            />

            {/* Top-Right Border Drag Handle */}
            <div
              onMouseDown={(e) => handleMouseDown(e, "top-right")}
              className="absolute -top-2 -right-2 w-4 h-4 bg-indigo-600 border-2 border-white rounded-full cursor-nesw-resize shadow-xl hover:scale-125 transition-transform z-30"
              title="Move cursor in/out to resize image (px)"
            />

            {/* Bottom-Left Border Drag Handle */}
            <div
              onMouseDown={(e) => handleMouseDown(e, "bottom-left")}
              className="absolute -bottom-2 -left-2 w-4 h-4 bg-indigo-600 border-2 border-white rounded-full cursor-nesw-resize shadow-xl hover:scale-125 transition-transform z-30"
              title="Move cursor in/out to resize image (px)"
            />

            {/* Bottom-Right Border Drag Handle */}
            <div
              onMouseDown={(e) => handleMouseDown(e, "bottom-right")}
              className="absolute -bottom-2 -right-2 w-4 h-4 bg-indigo-600 border-2 border-white rounded-full cursor-nwse-resize shadow-xl hover:scale-125 transition-transform z-30"
              title="Move cursor in/out to resize image (px)"
            />
          </>
        )}

        {/* Right-Click Vertical Image Management Dropdown Menu (Positioned on the Right of Image) */}
        {showContextMenu && (
          <div
            className="absolute top-0 left-full ml-3 z-50 min-w-[170px] bg-slate-900/95 border border-slate-700/70 rounded-xl shadow-2xl backdrop-blur-md p-1.5 flex flex-col gap-1 text-slate-200 text-xs animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              Image Control
            </div>

            {/* Alignment Row */}
            <div className="flex items-center gap-1 p-1 bg-slate-800/60 rounded-lg">
              <button
                onClick={() => updateAttributes({ textAlign: "left" })}
                className="flex-1 p-1.5 rounded hover:bg-slate-700 flex justify-center text-slate-300 hover:text-white transition-colors"
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateAttributes({ textAlign: "center" })}
                className="flex-1 p-1.5 rounded hover:bg-slate-700 flex justify-center text-slate-300 hover:text-white transition-colors"
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateAttributes({ textAlign: "right" })}
                className="flex-1 p-1.5 rounded hover:bg-slate-700 flex justify-center text-slate-300 hover:text-white transition-colors"
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reset Size Button */}
            <button
              onClick={() => {
                updateAttributes({ width: "100%" });
                setShowContextMenu(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-indigo-600/20 text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Reset Size (100%)</span>
            </button>

            {/* Copy & Cut Shortcuts */}
            <button
              onClick={() => {
                document.execCommand("copy");
                setShowContextMenu(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Image</span>
            </button>

            <button
              onClick={() => {
                document.execCommand("cut");
                setShowContextMenu(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Scissors className="w-3.5 h-3.5 text-slate-400" />
              <span>Cut Image</span>
            </button>

            <div className="my-0.5 border-t border-slate-800" />

            {/* Delete Image Action */}
            <button
              onClick={() => {
                deleteNode();
                setShowContextMenu(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Image</span>
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
