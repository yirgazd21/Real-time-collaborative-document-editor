import React, { useState, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading,
  List,
  ListOrdered,
  ListTodo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Download,
  FileCode,
  FileText,
  FileType,
  Undo,
  Redo,
  ChevronDown,
  Palette,
  Highlighter,
  Image as ImageIcon,
  Link2,
  Upload,
  FilePlus,
  Type,
  Circle,
  Square,
  Hash,
  Minus,
  Plus,
  Table as TableIcon,
} from "lucide-react";

export const EditorToolbar = ({
  editor,
  onExportPDF,
  onExportWord,
  onExportMarkdown,
}) => {
  const [headingOpen, setHeadingOpen] = useState(false);
  const [bulletOpen, setBulletOpen] = useState(false);
  const [numberOpen, setNumberOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  const [fontSize, setFontSize] = useState("16");

  const toolbarRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync current font size from editor mark
  useEffect(() => {
    if (editor) {
      const activeFontSize = editor.getAttributes("textStyle").fontSize;
      if (activeFontSize) {
        setFontSize(String(activeFontSize));
      }
    }
  }, [editor?.state.selection]);

  // Click Outside Handler to Close All Dropdowns Automatically
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setHeadingOpen(false);
        setBulletOpen(false);
        setNumberOpen(false);
        setColorOpen(false);
        setHighlightOpen(false);
        setImageOpen(false);
        setDownloadOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor) return null;

  // Font Size Helpers
  const updateFontSize = (newSize) => {
    const sizeNum = Math.max(8, Math.min(96, parseInt(newSize) || 16));
    setFontSize(String(sizeNum));
    editor.chain().focus().setFontSize(sizeNum).run();
  };

  const handleDecreaseFontSize = () => {
    const current = parseInt(fontSize) || 16;
    updateFontSize(current - 1);
  };

  const handleIncreaseFontSize = () => {
    const current = parseInt(fontSize) || 16;
    updateFontSize(current + 1);
  };

  // Add Link
  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  // Image from URL
  const addImageFromUrl = () => {
    const url = window.prompt("Enter Image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  // Image from Local File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Src = event.target?.result;
        if (base64Src) {
          editor.chain().focus().setImage({ src: base64Src }).run();
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  // Insert Page Break at Cursor
  const insertPageBreak = () => {
    editor.chain().focus().setHorizontalRule().run();
  };

  // Curated Color Palettes
  const textColors = [
    { label: "Default", color: "inherit" },
    { label: "Red", color: "#ef4444" },
    { label: "Emerald", color: "#10b981" },
    { label: "Royal Blue", color: "#3b82f6" },
    { label: "Indigo", color: "#6366f1" },
    { label: "Purple", color: "#a855f7" },
    { label: "Amber", color: "#f59e0b" },
    { label: "Rose", color: "#f43f5e" },
  ];

  const highlightColors = [
    { label: "None", color: "transparent" },
    { label: "Yellow", color: "#fef08a" },
    { label: "Green", color: "#bbf7d0" },
    { label: "Cyan", color: "#cffaff" },
    { label: "Pink", color: "#fbcfe8" },
    { label: "Orange", color: "#fed7aa" },
    { label: "Lavender", color: "#e9d5ff" },
  ];

  return (
    <div
      ref={toolbarRef}
      className="sticky top-14 z-30 glass-panel border-b border-slate-700/40 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-md"
    >
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Formatting Tools Group */}
      <div className="flex flex-wrap items-center gap-1">
        {/* Headings & Normal Text Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setHeadingOpen(!headingOpen);
              setBulletOpen(false);
              setNumberOpen(false);
              setColorOpen(false);
              setHighlightOpen(false);
              setImageOpen(false);
              setDownloadOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold opacity-80 hover:opacity-100 hover:bg-slate-500/10 transition-colors"
            title="Text Style & Headings"
          >
            <Type className="w-4 h-4 text-indigo-500" />
            <span>
              {editor.isActive("heading", { level: 1 })
                ? "Heading 1"
                : editor.isActive("heading", { level: 2 })
                ? "Heading 2"
                : editor.isActive("heading", { level: 3 })
                ? "Heading 3"
                : editor.isActive("heading", { level: 4 })
                ? "Heading 4"
                : "Normal Text"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {headingOpen && (
            <div className="absolute left-0 mt-2 w-44 glass-panel rounded-2xl p-1.5 shadow-2xl border border-slate-700/60 z-50 text-xs font-medium">
              <button
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setHeadingOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
              >
                Normal Text
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                  setHeadingOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
                title="Shortcut: Ctrl+Alt+1"
              >
                Heading 1 (Ctrl+Alt+1)
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                  setHeadingOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
                title="Shortcut: Ctrl+Alt+2"
              >
                Heading 2 (Ctrl+Alt+2)
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                  setHeadingOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
                title="Shortcut: Ctrl+Alt+3"
              >
                Heading 3 (Ctrl+Alt+3)
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 4 }).run();
                  setHeadingOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
                title="Shortcut: Ctrl+Alt+4"
              >
                Heading 4 (Ctrl+Alt+4)
              </button>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-slate-700/40 mx-1" />

        {/* Font Size Controller (- [ 16 ] +) */}
        <div className="flex items-center glass-panel rounded-lg px-1 py-0.5 border border-slate-700/50">
          <button
            onClick={handleDecreaseFontSize}
            className="p-1 rounded opacity-70 hover:opacity-100 hover:bg-slate-500/20 transition-colors text-xs"
            title="Decrease Font Size (-)"
          >
            <Minus className="w-3 h-3" />
          </button>
          <input
            type="number"
            value={fontSize}
            onChange={(e) => updateFontSize(e.target.value)}
            className="w-9 text-center bg-transparent text-xs font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            title="Font Size (pt)"
          />
          <button
            onClick={handleIncreaseFontSize}
            className="p-1 rounded opacity-70 hover:opacity-100 hover:bg-slate-500/20 transition-colors text-xs"
            title="Increase Font Size (+)"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <div className="w-px h-6 bg-slate-700/50 hidden md:block"></div>

        {/* Table Button */}
        <button
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="p-1.5 sm:p-2 rounded-xl transition-all glass-panel hover:bg-slate-800/30 hidden sm:block"
          title="Insert Table (3x3)"
        >
          <TableIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
        </button>

        <div className="w-px h-6 bg-slate-700/50 hidden md:block"></div>

        {/* Text Formats (Bold, Italic, Underline, Strikethrough) */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive("bold")
              ? "bg-indigo-600 text-white"
              : "opacity-70 hover:opacity-100 hover:bg-slate-500/10"
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive("italic")
              ? "bg-indigo-600 text-white"
              : "opacity-70 hover:opacity-100 hover:bg-slate-500/10"
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive("underline")
              ? "bg-indigo-600 text-white"
              : "opacity-70 hover:opacity-100 hover:bg-slate-500/10"
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive("strike")
              ? "bg-indigo-600 text-white"
              : "opacity-70 hover:opacity-100 hover:bg-slate-500/10"
          }`}
          title="Strikethrough (Ctrl+Shift+X)"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-700/40 mx-1" />

        {/* Text Color Picker Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setColorOpen(!colorOpen);
              setHeadingOpen(false);
              setBulletOpen(false);
              setNumberOpen(false);
              setHighlightOpen(false);
              setImageOpen(false);
              setDownloadOpen(false);
            }}
            className="p-2 rounded-lg opacity-70 hover:opacity-100 hover:bg-slate-500/10 transition-colors"
            title="Text Color"
          >
            <Palette className="w-4 h-4 text-indigo-400" />
          </button>

          {colorOpen && (
            <div className="absolute left-0 mt-2 w-48 glass-panel rounded-2xl p-2.5 shadow-2xl border border-slate-700/60 z-50">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60 mb-2">
                Preset Colors
              </p>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {textColors.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (c.color === "inherit") editor.chain().focus().unsetColor().run();
                      else editor.chain().focus().setColor(c.color).run();
                      setColorOpen(false);
                    }}
                    className="w-7 h-7 rounded-lg border border-slate-600/50 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.color === "inherit" ? "#94a3b8" : c.color }}
                    title={c.label}
                  />
                ))}
              </div>

              {/* Custom Color Picker Input */}
              <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between gap-2">
                <span className="text-[11px] opacity-80 font-medium">Custom Color:</span>
                <input
                  type="color"
                  onChange={(e) => {
                    editor.chain().focus().setColor(e.target.value).run();
                  }}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                  title="Custom Text Color Picker"
                />
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color Picker Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setHighlightOpen(!highlightOpen);
              setHeadingOpen(false);
              setBulletOpen(false);
              setNumberOpen(false);
              setColorOpen(false);
              setImageOpen(false);
              setDownloadOpen(false);
            }}
            className="p-2 rounded-lg opacity-70 hover:opacity-100 hover:bg-slate-500/10 transition-colors"
            title="Highlight Text Color"
          >
            <Highlighter className="w-4 h-4 text-amber-400" />
          </button>

          {highlightOpen && (
            <div className="absolute left-0 mt-2 w-48 glass-panel rounded-2xl p-2.5 shadow-2xl border border-slate-700/60 z-50">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60 mb-2">
                Highlight Presets
              </p>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {highlightColors.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (c.color === "transparent") editor.chain().focus().unsetHighlight().run();
                      else editor.chain().focus().toggleHighlight({ color: c.color }).run();
                      setHighlightOpen(false);
                    }}
                    className="w-7 h-7 rounded-lg border border-slate-600/50 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.color }}
                    title={c.label}
                  />
                ))}
              </div>

              {/* Custom Highlight Color Picker Input */}
              <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between gap-2">
                <span className="text-[11px] opacity-80 font-medium">Custom Highlight:</span>
                <input
                  type="color"
                  onChange={(e) => {
                    editor.chain().focus().toggleHighlight({ color: e.target.value }).run();
                  }}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                  title="Custom Highlight Color Picker"
                />
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-slate-700/40 mx-1" />

        {/* Bullet List Styles Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setBulletOpen(!bulletOpen);
              setHeadingOpen(false);
              setNumberOpen(false);
              setColorOpen(false);
              setHighlightOpen(false);
              setImageOpen(false);
              setDownloadOpen(false);
            }}
            className={`flex items-center gap-1 p-2 rounded-lg transition-colors ${
              editor.isActive("bulletList")
                ? "bg-indigo-600 text-white"
                : "opacity-70 hover:opacity-100 hover:bg-slate-500/10"
            }`}
            title="Bullet List Styles (Disc, Circle, Square)"
          >
            <List className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {bulletOpen && (
            <div className="absolute left-0 mt-2 w-44 glass-panel rounded-2xl p-1.5 shadow-2xl border border-slate-700/60 z-50 text-xs font-medium">
              <button
                onClick={() => {
                  editor.chain().focus().toggleBulletList().run();
                  setBulletOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
              >
                <span className="font-bold text-base">•</span>
                <span>Default Bullet (Disc)</span>
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleBulletList().run();
                  setBulletOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
              >
                <Circle className="w-3 h-3" />
                <span>Circle Bullet (◦)</span>
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleBulletList().run();
                  setBulletOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
              >
                <Square className="w-3 h-3" />
                <span>Square Bullet (▪)</span>
              </button>
            </div>
          )}
        </div>

        {/* Numbered List Styles Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setNumberOpen(!numberOpen);
              setHeadingOpen(false);
              setBulletOpen(false);
              setColorOpen(false);
              setHighlightOpen(false);
              setImageOpen(false);
              setDownloadOpen(false);
            }}
            className={`flex items-center gap-1 p-2 rounded-lg transition-colors ${
              editor.isActive("orderedList")
                ? "bg-indigo-600 text-white"
                : "opacity-70 hover:opacity-100 hover:bg-slate-500/10"
            }`}
            title="Numbered List Styles (123, abc, ABC, i ii iii)"
          >
            <ListOrdered className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {numberOpen && (
            <div className="absolute left-0 mt-2 w-48 glass-panel rounded-2xl p-1.5 shadow-2xl border border-slate-700/60 z-50 text-xs font-medium">
              <button
                onClick={() => {
                  editor.chain().focus().toggleOrderedList().run();
                  setNumberOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
              >
                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                <span> Number (1, 2, 3...)</span>
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleOrderedList().run();
                  setNumberOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
              >
                <span className="font-mono font-bold text-xs text-indigo-400">a.b.c</span>
                <span>Lowercase  (a, b, c)</span>
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleOrderedList().run();
                  setNumberOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
              >
                <span className="font-mono font-bold text-xs text-indigo-400">A.B.C</span>
                <span>Uppercase  (A, B, C)</span>
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleOrderedList().run();
                  setNumberOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
              >
                <span className="font-mono font-bold text-xs text-indigo-400">i.ii</span>
                <span> roman (i, ii, iii)</span>
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleOrderedList().run();
                  setNumberOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
              >
                <span className="font-mono font-bold text-xs text-indigo-400">I.II</span>
                <span> ROMAN (I, II, III)</span>
              </button>
            </div>
          )}
        </div>

        {/* Checkbox Task List */}
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive("taskList")
              ? "bg-indigo-600 text-white"
              : "opacity-70 hover:opacity-100 hover:bg-slate-500/10"
          }`}
          title="Checkbox Task List (Ctrl+Shift+9)"
        >
          <ListTodo className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-700/40 mx-1" />

        {/* Alignment */}
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive({ textAlign: "left" })
              ? "bg-indigo-600 text-white"
              : "opacity-70 hover:opacity-100 hover:bg-slate-500/10"
          }`}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive({ textAlign: "center" })
              ? "bg-indigo-600 text-white"
              : "opacity-70 hover:opacity-100 hover:bg-slate-500/10"
          }`}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive({ textAlign: "right" })
              ? "bg-indigo-600 text-white"
              : "opacity-70 hover:opacity-100 hover:bg-slate-500/10"
          }`}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive({ textAlign: "justify" })
              ? "bg-indigo-600 text-white"
              : "opacity-70 hover:opacity-100 hover:bg-slate-500/10"
          }`}
          title="Justify Text"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-700/40 mx-1" />

        {/* Hyperlink */}
        <button
          onClick={addLink}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive("link")
              ? "bg-indigo-600 text-white"
              : "opacity-70 hover:opacity-100 hover:bg-slate-500/10"
          }`}
          title="Insert Hyperlink (Ctrl+K)"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        {/* Insert Image Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setImageOpen(!imageOpen);
              setHeadingOpen(false);
              setBulletOpen(false);
              setNumberOpen(false);
              setColorOpen(false);
              setHighlightOpen(false);
              setDownloadOpen(false);
            }}
            className="p-2 rounded-lg opacity-70 hover:opacity-100 hover:bg-slate-500/10 transition-colors"
            title="Insert Image (From URL or Computer File)"
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
          </button>

          {imageOpen && (
            <div className="absolute left-0 mt-2 w-48 glass-panel rounded-2xl p-1.5 shadow-2xl border border-slate-700/60 z-50 text-xs font-medium">
              <button
                onClick={() => {
                  addImageFromUrl();
                  setImageOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
              >
                <Link2 className="w-4 h-4 text-indigo-400" />
                <span>Insert Image from URL</span>
              </button>
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setImageOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Upload Image File</span>
              </button>
            </div>
          )}
        </div>

        {/* Insert Page Break Button */}
        <button
          onClick={insertPageBreak}
          className="p-2 rounded-lg opacity-70 hover:opacity-100 hover:bg-slate-500/10 transition-colors"
          title="Insert Page Break at Cursor (Ctrl+Enter)"
        >
          <FilePlus className="w-4 h-4 text-cyan-400" />
        </button>

        <div className="h-5 w-px bg-slate-700/40 mx-1" />

        {/* Undo / Redo */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded-lg opacity-70 hover:opacity-100 hover:bg-slate-500/10 disabled:opacity-30 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded-lg opacity-70 hover:opacity-100 hover:bg-slate-500/10 disabled:opacity-30 transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Download Export Dropdown */}
      <div className="relative">
        <button
          onClick={() => {
            setDownloadOpen(!downloadOpen);
            setHeadingOpen(false);
            setBulletOpen(false);
            setNumberOpen(false);
            setColorOpen(false);
            setHighlightOpen(false);
            setImageOpen(false);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-80" />
        </button>

        {downloadOpen && (
          <div className="absolute right-0 mt-2 w-48 glass-panel rounded-2xl p-1.5 shadow-2xl border border-slate-700/60 z-50 text-xs font-medium animate-in fade-in slide-in-from-top-2">
            <button
              onClick={() => {
                onExportPDF();
                setDownloadOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
            >
              <FileType className="w-4 h-4 text-indigo-500" />
              <span>Export as PDF (.pdf)</span>
            </button>

            <button
              onClick={() => {
                onExportWord();
                setDownloadOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
            >
              <FileText className="w-4 h-4 text-cyan-500" />
              <span>Export as Word (.doc)</span>
            </button>

            <button
              onClick={() => {
                onExportMarkdown();
                setDownloadOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors"
            >
              <FileCode className="w-4 h-4 text-purple-500" />
              <span>Export as Markdown (.md)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
