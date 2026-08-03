import React, { useState } from "react";
import { BubbleMenu } from "@tiptap/react";
import { 
  Table as TableIcon, 
  Trash2, 
  ArrowUpToLine, 
  ArrowDownToLine, 
  ArrowLeftToLine, 
  ArrowRightToLine, 
  Minus, 
  Scissors, 
  Copy,
  Palette
} from "lucide-react";

export const TableBubbleMenu = ({ editor }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!editor) return null;

  const colors = [
    "transparent", "#f87171", "#fb923c", "#facc15", "#4ade80", "#2dd4bf", 
    "#60a5fa", "#818cf8", "#c084fc", "#f472b6", "#94a3b8"
  ];

  const handleColorSelect = (color) => {
    editor.chain().focus().setCellAttribute('backgroundColor', color === "transparent" ? null : color).run();
    setShowColorPicker(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }) => editor.isActive("table")}
      tippyOptions={{ duration: 100, placement: "right", interactive: true }}
      className="flex flex-col gap-2 p-2 rounded-xl border border-slate-700/50 bg-slate-900 shadow-xl backdrop-blur-md z-50"
    >
      <div className="flex items-center gap-1">
        <button
          onClick={() => editor.chain().focus().addRowBefore().run()}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
          title="Add Row Above"
        >
          <ArrowUpToLine className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().addRowAfter().run()}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
          title="Add Row Below"
        >
          <ArrowDownToLine className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().deleteRow().run()}
          className="p-1.5 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
          title="Delete Row"
        >
          <Minus className="w-4 h-4 rotate-90" />
        </button>

        <div className="w-px h-4 bg-slate-700 mx-1" />

        <button
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
          title="Add Column Left"
        >
          <ArrowLeftToLine className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
          title="Add Column Right"
        >
          <ArrowRightToLine className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().deleteColumn().run()}
          className="p-1.5 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
          title="Delete Column"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-700 mx-1" />

        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`p-1.5 rounded transition-colors ${showColorPicker ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-slate-800 text-slate-300'}`}
            title="Cell Background Color"
          >
            <Palette className="w-4 h-4" />
          </button>
          
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-slate-800 rounded-xl border border-slate-700 shadow-xl grid grid-cols-4 gap-1 w-36">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`w-6 h-6 rounded-full border border-slate-600 hover:scale-110 transition-transform ${color === 'transparent' ? 'bg-stripes opacity-50' : ''}`}
                  style={{ backgroundColor: color === 'transparent' ? 'transparent' : color }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-slate-700 mx-1" />
        
        <button
          onClick={() => {
            // Cut requires selecting the table node first, then execCommand
            document.execCommand('cut');
          }}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
          title="Cut Selection"
        >
          <Scissors className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            document.execCommand('copy');
          }}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
          title="Copy Selection"
        >
          <Copy className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-700 mx-1" />

        <button
          onClick={() => editor.chain().focus().deleteTable().run()}
          className="p-1.5 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
          title="Delete Table"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </BubbleMenu>
  );
};
