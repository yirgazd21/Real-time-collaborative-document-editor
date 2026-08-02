import React from "react";
import { BubbleMenu } from "@tiptap/react";
import { Crop, Trash2, AlignLeft, AlignCenter, AlignRight, Scissors, Copy } from "lucide-react";

export const ImageBubbleMenu = ({ editor, onOpenCrop }) => {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }) => {
        return editor.isActive("image");
      }}
      tippyOptions={{ duration: 100, placement: "bottom" }}
      className="flex items-center gap-1 p-2 rounded-xl border border-slate-700/50 bg-slate-900 shadow-xl backdrop-blur-md"
    >
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
