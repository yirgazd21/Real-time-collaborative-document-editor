import React from "react";
import { BubbleMenu } from "@tiptap/react";
import { Crop, Trash2, AlignLeft, AlignCenter, AlignRight, Scissors, Copy, ZoomIn, ZoomOut } from "lucide-react";

export const ImageBubbleMenu = ({ editor, onOpenCrop }) => {
  if (!editor) return null;

  const currentWidth = editor.getAttributes("image").width || "100%";

  const handleZoom = (delta) => {
    let numeric = parseInt(currentWidth) || 100;
    const isPx = String(currentWidth).includes("px");
    if (isPx) {
      const nextWidth = Math.max(80, Math.min(794, numeric + delta * 50));
      editor.chain().focus().updateAttributes("image", { width: `${nextWidth}px` }).run();
    } else {
      const nextWidth = Math.max(20, Math.min(100, numeric + delta * 15));
      editor.chain().focus().updateAttributes("image", { width: `${nextWidth}%` }).run();
    }
  };

  const handleSetWidth = (percentage) => {
    editor.chain().focus().updateAttributes("image", { width: `${percentage}%` }).run();
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }) => {
        return editor.isActive("image");
      }}
      tippyOptions={{ duration: 100, placement: "bottom" }}
      className="flex items-center gap-1 p-2 rounded-xl border border-slate-700/50 bg-slate-900 shadow-xl backdrop-blur-md"
    >
      {/* Alignment Buttons */}
      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-slate-800 text-slate-300'}`}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-slate-800 text-slate-300'}`}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-slate-800 text-slate-300'}`}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-slate-700 mx-1" />

      {/* Zoom In & Zoom Out Controls */}
      <button
        onClick={() => handleZoom(-1)}
        className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
        title="Zoom Out Image"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <button
        onClick={() => handleZoom(1)}
        className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
        title="Zoom In Image"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-slate-700 mx-1" />

      {/* Preset Size Shortcuts */}
      <button
        onClick={() => handleSetWidth(25)}
        className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${currentWidth === '25%' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
        title="25% Size"
      >
        25%
      </button>
      <button
        onClick={() => handleSetWidth(50)}
        className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${currentWidth === '50%' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
        title="50% Size"
      >
        50%
      </button>
      <button
        onClick={() => handleSetWidth(75)}
        className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${currentWidth === '75%' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
        title="75% Size"
      >
        75%
      </button>
      <button
        onClick={() => handleSetWidth(100)}
        className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${currentWidth === '100%' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
        title="Full Width (100%)"
      >
        100%
      </button>

      <div className="w-px h-4 bg-slate-700 mx-1" />

      {/* Clipboard & Editing Tools */}
      <button
        onClick={() => {
          document.execCommand('cut');
        }}
        className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
        title="Cut"
      >
        <Scissors className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          document.execCommand('copy');
        }}
        className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
        title="Copy"
      >
        <Copy className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-slate-700 mx-1" />

      <button
        onClick={() => {
          const src = editor.getAttributes("image").src;
          if (src) {
            onOpenCrop(src);
          }
        }}
        className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
        title="Crop Image"
      >
        <Crop className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-slate-700 mx-1" />

      <button
        onClick={() => {
          editor.chain().focus().deleteSelection().run();
        }}
        className="p-1.5 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
        title="Delete Image"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </BubbleMenu>
  );
};
