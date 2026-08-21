"use client";

import { useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { listMediaAssets, uploadMedia } from "@/server/admin/media";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Image as ImageExtension } from "@tiptap/extension-image";

/* SVG Icons for compact, modern toolbar */
function UndoIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h10.5m-10.5 5.25h16.5" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M6.75 12h10.5M3.75 17.25h16.5" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M9.75 12h10.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function AlignJustifyIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function BulletListIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.008v.008H3.75V6.75zm0 5.25h.008v.008H3.75V12zm0 5.25h.008v.008H3.75v-.008z" />
    </svg>
  );
}

function OrderedListIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M4 6h1v4M3 10h3M3 14h2.5c.8 0 1.5.5 1.5 1.25s-.7 1.25-1.5 1.25H3v1.5h4" />
    </svg>
  );
}

function TaskListIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  );
}

function CodeBlockIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

function DividerIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6zM3.75 9.75h16.5M3.75 14.25h16.5M9.75 3.75v16.5M14.25 3.75v16.5" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58-4.92l-6.37 6.37a2.25 2.25 0 000 3.18l2.12 2.12a2.25 2.25 0 003.18 0l6.37-6.37m-5.3-5.3l3.18-3.18a2.25 2.25 0 013.18 0l3.18 3.18a2.25 2.25 0 010 3.18l-3.18 3.18" />
    </svg>
  );
}

function HighlightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

type RichTextEditorProps = {
  label?: string;
  name: string;
  defaultValue?: string | null;
  errors?: string[];
  hint?: string;
  id?: string;
  className?: string;
};

export function RichTextEditor({
  label,
  name,
  defaultValue = "",
  errors,
  hint,
  id,
  className = "",
}: RichTextEditorProps) {
  const [htmlValue, setHtmlValue] = useState(defaultValue || "");

  // Modal states for Image & Link insertion
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  // Link Modal States
  const [linkUrl, setLinkUrl] = useState("");

  // Image Modal States
  const [imgTab, setImgTab] = useState<"upload" | "library" | "url">("upload");
  const [imgUrlInput, setImgUrlInput] = useState("");
  const [imgAltInput, setImgAltInput] = useState("");
  const [libraryAssets, setLibraryAssets] = useState<{ id: string; title: string; url: string }[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Upload Tab States inside Image Modal
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      Subscript,
      Superscript,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse border border-slate-300 w-full my-4 text-sm",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-slate-300 bg-slate-100 p-2 font-bold text-left",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-slate-300 p-2",
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-bdaio-blue underline hover:text-bdaio-blue-dark font-medium",
        },
      }),
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg shadow-xs my-2 border border-slate-200",
        },
      }),
    ],
    content: defaultValue || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none focus:outline-none min-h-[180px] p-4 text-sm leading-relaxed text-slate-800",
      },
    },
    onUpdate: ({ editor }) => {
      setHtmlValue(editor.getHTML());
    },
  });

  const openLinkModal = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    setLinkUrl(previousUrl);
    setLinkModalOpen(true);
  };

  const handleApplyLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;

    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl.trim() }).run();
    }
    setLinkModalOpen(false);
  };

  const openImageModal = async () => {
    setImageModalOpen(true);
    setLoadingAssets(true);
    try {
      const assets = await listMediaAssets();
      setLibraryAssets(assets);
    } catch {
      // Ignore if unauthenticated
    } finally {
      setLoadingAssets(false);
    }
  };

  const insertImageSrc = (src: string, alt?: string) => {
    if (!editor || !src) return;
    editor.chain().focus().setImage({ src, alt: alt || "" }).run();
    setImageModalOpen(false);
    setUploadFile(null);
    setUploadPreview(null);
    setImgUrlInput("");
  };

  function handleFileSelected(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Image must be 2 MB or smaller.");
      return;
    }
    setUploadError(null);
    setUploadFile(file);
    setUploadTitle(file.name.replace(/\.[^.]+$/, ""));
    setUploadPreview(URL.createObjectURL(file));
  }

  async function handleQuickUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("title", uploadTitle || uploadFile.name);

    try {
      const res = await uploadMedia(undefined, formData);
      if (res?.errors?.file) {
        setUploadError(res.errors.file[0]);
      } else if (res?.errors?.title) {
        setUploadError(res.errors.title[0]);
      } else {
        const assets = await listMediaAssets();
        setLibraryAssets(assets);
        if (assets.length > 0) {
          insertImageSrc(assets[0].url, assets[0].title);
        }
      }
    } catch {
      setUploadError("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id || name} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs focus-within:border-bdaio-blue focus-within:ring-2 focus-within:ring-bdaio-blue/30">
        {/* Compact Icon-Based Toolbar */}
        {editor && (
          <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/90 p-1.5 text-slate-700 select-none">
            {/* History */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="rounded p-1.5 hover:bg-slate-200 disabled:opacity-30 transition"
                title="Undo (Ctrl+Z)"
              >
                <UndoIcon />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="rounded p-1.5 hover:bg-slate-200 disabled:opacity-30 transition"
                title="Redo (Ctrl+Y)"
              >
                <RedoIcon />
              </button>
            </div>

            <span className="mx-1 h-4 w-px bg-slate-200" />

            {/* Headings */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`rounded px-2 py-1 font-bold text-xs transition ${
                  editor.isActive("heading", { level: 1 })
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Heading 1"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`rounded px-2 py-1 font-bold text-xs transition ${
                  editor.isActive("heading", { level: 2 })
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Heading 2"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`rounded px-2 py-1 font-bold text-xs transition ${
                  editor.isActive("heading", { level: 3 })
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Heading 3"
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={`rounded px-2 py-1 font-semibold text-xs transition ${
                  editor.isActive("paragraph")
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Normal Paragraph"
              >
                P
              </button>
            </div>

            <span className="mx-1 h-4 w-px bg-slate-200" />

            {/* Formatting Marks */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`rounded px-2 py-1 font-extrabold text-xs transition ${
                  editor.isActive("bold")
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`rounded px-2 py-1 italic font-serif text-xs transition ${
                  editor.isActive("italic")
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`rounded px-2 py-1 underline font-semibold text-xs transition ${
                  editor.isActive("underline")
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Underline"
              >
                U
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`rounded px-2 py-1 line-through font-semibold text-xs transition ${
                  editor.isActive("strike")
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Strikethrough"
              >
                S
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                className={`rounded px-1.5 py-1 text-[10px] font-semibold transition ${
                  editor.isActive("subscript")
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Subscript (X₂)"
              >
                X₂
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                className={`rounded px-1.5 py-1 text-[10px] font-semibold transition ${
                  editor.isActive("superscript")
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Superscript (X²)"
              >
                X²
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className={`rounded p-1.5 transition ${
                  editor.isActive("highlight")
                    ? "bg-amber-300 text-slate-900"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Highlight"
              >
                <HighlightIcon />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={`rounded px-1.5 py-1 font-mono text-xs transition ${
                  editor.isActive("code")
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Inline Code"
              >
                {"</>"}
              </button>
            </div>

            <span className="mx-1 h-4 w-px bg-slate-200" />

            {/* Alignments */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
                className={`rounded p-1.5 transition ${
                  editor.isActive({ textAlign: "left" })
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Align Left"
              >
                <AlignLeftIcon />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
                className={`rounded p-1.5 transition ${
                  editor.isActive({ textAlign: "center" })
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Align Center"
              >
                <AlignCenterIcon />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
                className={`rounded p-1.5 transition ${
                  editor.isActive({ textAlign: "right" })
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Align Right"
              >
                <AlignRightIcon />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                className={`rounded p-1.5 transition ${
                  editor.isActive({ textAlign: "justify" })
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Justify"
              >
                <AlignJustifyIcon />
              </button>
            </div>

            <span className="mx-1 h-4 w-px bg-slate-200" />

            {/* Lists */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`rounded p-1.5 transition ${
                  editor.isActive("bulletList")
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Bullet List"
              >
                <BulletListIcon />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`rounded p-1.5 transition ${
                  editor.isActive("orderedList")
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Numbered List"
              >
                <OrderedListIcon />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                className={`rounded p-1.5 transition ${
                  editor.isActive("taskList")
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Task Checklist"
              >
                <TaskListIcon />
              </button>
            </div>

            <span className="mx-1 h-4 w-px bg-slate-200" />

            {/* Inserts & Blocks */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`rounded p-1.5 transition ${
                  editor.isActive("blockquote")
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Quote"
              >
                <QuoteIcon />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`rounded p-1.5 transition ${
                  editor.isActive("codeBlock")
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Code Block"
              >
                <CodeBlockIcon />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                className="rounded p-1.5 hover:bg-slate-200 text-slate-700 transition"
                title="Horizontal Divider"
              >
                <DividerIcon />
              </button>
              <button
                type="button"
                onClick={() =>
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                }
                className="rounded p-1.5 hover:bg-slate-200 text-slate-700 transition"
                title="Insert Table"
              >
                <TableIcon />
              </button>
              <button
                type="button"
                onClick={openImageModal}
                className="rounded p-1.5 hover:bg-slate-200 text-slate-700 transition"
                title="Insert Image"
              >
                <ImageIcon />
              </button>
              <button
                type="button"
                onClick={openLinkModal}
                className={`rounded p-1.5 transition ${
                  editor.isActive("link")
                    ? "bg-bdaio-blue text-white"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
                title="Insert Link"
              >
                <LinkIcon />
              </button>
            </div>

            {/* Table Controls (Only active when inside a table) */}
            {editor.isActive("table") && (
              <>
                <span className="mx-1 h-4 w-px bg-slate-200" />
                <div className="flex items-center gap-1 bg-slate-200/60 rounded px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().addColumnBefore().run()}
                    className="rounded px-1.5 py-0.5 text-[11px] font-medium bg-white text-slate-700 hover:bg-slate-50"
                  >
                    +Col
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                    className="rounded px-1.5 py-0.5 text-[11px] font-medium bg-white text-slate-700 hover:bg-slate-50"
                  >
                    -Col
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().addRowBefore().run()}
                    className="rounded px-1.5 py-0.5 text-[11px] font-medium bg-white text-slate-700 hover:bg-slate-50"
                  >
                    +Row
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteRow().run()}
                    className="rounded px-1.5 py-0.5 text-[11px] font-medium bg-white text-slate-700 hover:bg-slate-50"
                  >
                    -Row
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    className="rounded px-1.5 py-0.5 text-[11px] font-medium bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    Del Table
                  </button>
                </div>
              </>
            )}

            <span className="mx-1 h-4 w-px bg-slate-200" />

            {/* Clear Formatting */}
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
              className="rounded p-1.5 hover:bg-red-50 text-red-600 transition"
              title="Clear formatting"
            >
              <ClearIcon />
            </button>
          </div>
        )}

        <EditorContent editor={editor} />
      </div>

      {/* Hidden input syncs HTML content with native form actions */}
      <input type="hidden" name={name} id={id} value={htmlValue} />

      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {errors && errors.length > 0 && (
        <p className="text-xs font-medium text-red-600">{errors[0]}</p>
      )}

      {/* Link Insertion Modal */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Insert Link</h3>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleApplyLink} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Link URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-bdaio-blue px-4 py-2 text-xs font-bold text-white hover:bg-bdaio-blue-dark shadow-2xs"
                >
                  Apply Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Insertion Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Insert Image</h3>
                <p className="text-xs text-slate-500">Upload a new image, pick from library, or paste a URL.</p>
              </div>
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-3 flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setImgTab("upload")}
                className={`border-b-2 px-4 py-2 text-xs font-bold transition ${
                  imgTab === "upload"
                    ? "border-bdaio-blue text-bdaio-blue"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                📤 Upload Image
              </button>
              <button
                type="button"
                onClick={() => setImgTab("library")}
                className={`border-b-2 px-4 py-2 text-xs font-bold transition ${
                  imgTab === "library"
                    ? "border-bdaio-blue text-bdaio-blue"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                🖼️ Media Library ({libraryAssets.length})
              </button>
              <button
                type="button"
                onClick={() => setImgTab("url")}
                className={`border-b-2 px-4 py-2 text-xs font-bold transition ${
                  imgTab === "url"
                    ? "border-bdaio-blue text-bdaio-blue"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                🔗 Image URL
              </button>
            </div>

            {/* Tab 1: Upload Image */}
            {imgTab === "upload" && (
              <form onSubmit={handleQuickUpload} className="mt-4 space-y-4 flex-1 overflow-y-auto">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith("image/")) handleFileSelected(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition ${
                    isDragging
                      ? "border-bdaio-blue bg-bdaio-blue/10"
                      : "border-slate-300 bg-slate-50/50 hover:border-bdaio-blue hover:bg-blue-50/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelected(file);
                    }}
                  />

                  {uploadPreview ? (
                    <div className="relative flex h-32 w-48 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={uploadPreview} alt="" className="max-h-full w-auto object-contain" />
                    </div>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bdaio-blue/10 text-bdaio-blue">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Drag & drop image here, or <span className="text-bdaio-blue underline">browse</span>
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Supports PNG, JPEG, WebP up to 2 MB
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {uploadFile && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Image Title</label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      required
                      placeholder="e.g. Diagram 1"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
                    />
                  </div>
                )}

                {uploadError && <p className="text-xs font-semibold text-red-600">{uploadError}</p>}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={!uploadFile || isUploading}
                    className="rounded-lg bg-bdaio-blue px-4 py-2 text-xs font-bold text-white disabled:opacity-50 hover:bg-bdaio-blue-dark transition shadow-2xs"
                  >
                    {isUploading ? "Uploading…" : "Upload & Insert"}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Media Library */}
            {imgTab === "library" && (
              <div className="mt-4 flex flex-1 flex-col overflow-hidden">
                {loadingAssets ? (
                  <p className="py-8 text-center text-xs text-slate-400">Loading library…</p>
                ) : libraryAssets.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-center">
                    <p className="text-sm font-semibold text-slate-600">No images in library</p>
                    <button
                      type="button"
                      onClick={() => setImgTab("upload")}
                      className="mt-2 text-xs font-bold text-bdaio-blue hover:underline"
                    >
                      Upload an image now →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 overflow-y-auto pr-1">
                    {libraryAssets.map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => insertImageSrc(asset.url, asset.title)}
                        className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-2 text-left hover:border-bdaio-blue hover:shadow-md transition"
                      >
                        <div className="relative flex h-24 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={asset.url}
                            alt={asset.title}
                            className="max-h-full w-auto object-contain transition group-hover:scale-105"
                          />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-800 line-clamp-1">
                          {asset.title}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Image URL */}
            {imgTab === "url" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  insertImageSrc(imgUrlInput, imgAltInput);
                }}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Image URL</label>
                  <input
                    type="url"
                    value={imgUrlInput}
                    onChange={(e) => setImgUrlInput(e.target.value)}
                    required
                    placeholder="https://example.com/image.jpg"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Alt Description (Optional)</label>
                  <input
                    type="text"
                    value={imgAltInput}
                    onChange={(e) => setImgAltInput(e.target.value)}
                    placeholder="Brief description of the image"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-bdaio-blue focus:outline-none focus:ring-2 focus:ring-bdaio-blue/30"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={!imgUrlInput.trim()}
                    className="rounded-lg bg-bdaio-blue px-4 py-2 text-xs font-bold text-white disabled:opacity-50 hover:bg-bdaio-blue-dark transition shadow-2xs"
                  >
                    Insert Image
                  </button>
                </div>
              </form>
            )}

            {/* Footer */}
            <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
