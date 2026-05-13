"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { ResizableImage } from "@/lib/editor/resizable-image";
import { useAuth } from "@clerk/nextjs";
import { useDebouncedCallback } from "use-debounce";
import { useNoteApi, Note } from "@/lib/api/note.api";
import { toast } from "sonner";
import {
  Loader2, Bold, Italic, List, ListOrdered, Quote, Code,
  Heading1, Heading2, Tag as TagIcon, X, ChevronRight,
  Heading3, Minus, UploadCloud, ChevronLeft, ChevronRight as ChevronRightIcon,
  ZoomIn, ZoomOut, RotateCw, Maximize2
} from "lucide-react";

import Link from "next/link";

// ─── Slash Command Definitions ────────────────────────────────────────────────

const SLASH_COMMANDS = [
  { id: "h1", label: "Heading 1", desc: "Large section heading", icon: <Heading1 className="w-4 h-4" />, apply: (e: any) => e.chain().focus().clearNodes().toggleHeading({ level: 1 }).run() },
  { id: "h2", label: "Heading 2", desc: "Medium section heading", icon: <Heading2 className="w-4 h-4" />, apply: (e: any) => e.chain().focus().clearNodes().toggleHeading({ level: 2 }).run() },
  { id: "h3", label: "Heading 3", desc: "Small section heading", icon: <Heading3 className="w-4 h-4" />, apply: (e: any) => e.chain().focus().clearNodes().toggleHeading({ level: 3 }).run() },
  { id: "code", label: "Code Block", desc: "Code with syntax", icon: <Code className="w-4 h-4" />, apply: (e: any) => e.chain().focus().clearNodes().toggleCodeBlock().run() },
  { id: "quote", label: "Blockquote", desc: "Capture a quote", icon: <Quote className="w-4 h-4" />, apply: (e: any) => e.chain().focus().clearNodes().toggleBlockquote().run() },
  { id: "list", label: "Bullet List", desc: "Simple unordered list", icon: <List className="w-4 h-4" />, apply: (e: any) => e.chain().focus().clearNodes().toggleBulletList().run() },
  { id: "ol", label: "Numbered List", desc: "Ordered numbered list", icon: <ListOrdered className="w-4 h-4" />, apply: (e: any) => e.chain().focus().clearNodes().toggleOrderedList().run() },
  { id: "divider", label: "Divider", desc: "Horizontal rule", icon: <Minus className="w-4 h-4" />, apply: (e: any) => e.chain().focus().setHorizontalRule().run() },
] as const;

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

const Breadcrumb = ({ note }: { note: Note }) => {
  const crumbs = useMemo(() => {
    if (!note.folder) return [];
    const path: { id: string; name: string }[] = [];
    let curr: any = note.folder;
    while (curr) {
      path.unshift({ id: curr.id, name: curr.name });
      curr = curr.parent ?? null;
    }
    return path;
  }, [note.folder]);

  if (crumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 flex-wrap mb-2" aria-label="Breadcrumb">
      <Link
        href="/dashboard/notes"
        className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors"
      >
        Notes
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.id} className="flex items-center gap-1">
          <ChevronRight className="w-2.5 h-2.5 text-slate-700" />
          {i < crumbs.length - 1 ? (
            <Link
              href="/dashboard/notes"
              className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors"
            >
              {crumb.name}
            </Link>
          ) : (
            <span className="text-[11px] text-slate-500 font-medium">{crumb.name}</span>
          )}
        </span>
      ))}
    </nav>
  );
};

// ─── Tag Input ────────────────────────────────────────────────────────────────

const TagRow = ({
  tags,
  onAdd,
  onRemove,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}) => {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      const newTag = input.trim().toLowerCase().substring(0, 50);
      if (!tags.includes(newTag)) onAdd(newTag);
      setInput("");
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-8 pb-6 border-b border-white/5">
      {tags.map(tag => (
        <span
          key={tag}
          className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors"
        >
          <span className="opacity-40 select-none">#</span>
          {tag}
          <button
            onClick={() => onRemove(tag)}
            className="ml-0.5 text-indigo-400/70 hover:text-white transition-colors focus:outline-none"
            aria-label={`Remove tag ${tag}`}
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      <div className="flex items-center gap-1.5 min-w-[100px]">
        <TagIcon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "Add tag..." : ""}
          className="bg-transparent border-none text-slate-500 focus:text-slate-300 focus:outline-none focus:ring-0 text-xs placeholder-slate-700 w-full transition-colors"
        />
      </div>
    </div>
  );
};

// ─── Toolbar Button ───────────────────────────────────────────────────────────

const ToolbarBtn = ({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void;
  isActive: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded-md transition-all duration-150 ease-out active:scale-95 ${isActive
      ? "bg-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.08)]"
      : "text-white/60 hover:text-white hover:bg-white/10 hover:shadow-[0_0_8px_rgba(255,255,255,0.05)]"
      }`}
  >
    {children}
  </button>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EditorPage() {
  const { noteId } = useParams<{ noteId: string }>();
  const { isLoaded, isSignedIn } = useAuth();
  const api = useNoteApi();

  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  type SaveStatus = 'idle' | 'editing' | 'saving' | 'saved' | 'error';
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const lastUpdatedAtRef = useRef<string | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Auto-hide toolbar state
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const toolbarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Floating selection toolbar state
  const [selectionCoords, setSelectionCoords] = useState<{ top: number; left: number } | null>(null);



  // Slash command menu state
  const [slashMenu, setSlashMenu] = useState<{
    open: boolean;
    query: string;
    top: number;
    left: number;
    selectedIndex: number;
  }>({ open: false, query: "", top: 0, left: 0, selectedIndex: 0 });
  const slashMenuRef = useRef(slashMenu);
  useEffect(() => { slashMenuRef.current = slashMenu; }, [slashMenu]);

  // ── Auto-hide toolbar: reset on any activity
  useEffect(() => {
    const show = () => {
      setToolbarVisible(true);
      if (toolbarTimerRef.current) clearTimeout(toolbarTimerRef.current);
      toolbarTimerRef.current = setTimeout(() => setToolbarVisible(false), 2500);
    };
    window.addEventListener("mousemove", show);
    window.addEventListener("keydown", show);
    return () => {
      window.removeEventListener("mousemove", show);
      window.removeEventListener("keydown", show);
      if (toolbarTimerRef.current) clearTimeout(toolbarTimerRef.current);
    };
  }, []);

  // ── Floating selection mini-toolbar: show on text selection
  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setSelectionCoords(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (rect.width > 0) {
        setSelectionCoords({ top: rect.top - 52, left: rect.left + rect.width / 2 });
      } else {
        setSelectionCoords(null);
      }
    };
    const handleMouseDown = () => setSelectionCoords(null);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  const editorRef = useRef<any>(null);

  const applySlashCommand = useCallback((cmd: typeof SLASH_COMMANDS[number], editorInstance: any) => {
    if (!editorInstance) return;
    const { state } = editorInstance;
    const { selection } = state;
    const { $anchor } = selection;
    // Delete the whole "/query" text from start of paragraph
    const nodeStart = $anchor.start();
    editorInstance.chain()
      .focus()
      .deleteRange({ from: nodeStart, to: selection.anchor })
      .run();
    cmd.apply(editorInstance);
    setSlashMenu(m => ({ ...m, open: false, query: "" }));
  }, []);

  // ─── Tiptap ───────────────────────────────────────────────────────────────

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: {},
        bulletList: {},
        orderedList: {},
        blockquote: {},
        horizontalRule: {},
      }),
      Placeholder.configure({
        placeholder: "Start typing or press '/' for commands",
        emptyEditorClass: "is-editor-empty",
      }),
      ResizableImage,
    ],
    content: note?.content || "",
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-slate max-w-none focus:outline-none min-h-[500px] prose-p:leading-relaxed prose-headings:font-bold",
      },
      handleKeyDown: (_view, event) => {
        const sm = slashMenuRef.current;
        if (!sm.open) return false;
        if (event.key === "Escape") { setSlashMenu(m => ({ ...m, open: false })); return true; }
        if (event.key === "ArrowDown") {
          setSlashMenu(m => ({ ...m, selectedIndex: Math.min(m.selectedIndex + 1, filteredSlashCommands.length - 1) }));
          return true;
        }
        if (event.key === "ArrowUp") {
          setSlashMenu(m => ({ ...m, selectedIndex: Math.max(m.selectedIndex - 1, 0) }));
          return true;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          const cmd = filteredSlashCommands[sm.selectedIndex];
          if (cmd && editorRef.current) { applySlashCommand(cmd, editorRef.current); return true; }
        }
        return false;
      },
    },
    onUpdate: ({ editor: editorInstance }) => {
      const { state, view } = editorInstance;
      const { selection } = state;
      const { $anchor } = selection;
      const nodeText = $anchor.parent.textContent;

      if (nodeText.startsWith("/")) {
        const query = nodeText.substring(1);
        const coords = view.coordsAtPos(selection.anchor);
        setSlashMenu({
          open: true,
          query,
          top: coords.bottom + 6,
          left: coords.left,
          selectedIndex: 0,
        });
      } else {
        setSlashMenu(m => m.open ? { ...m, open: false, query: "" } : m);
      }

      setSaveStatus('editing');
      handleAutoSave(title, editorInstance.getJSON(), editorInstance.getText(), tags);
    },
    immediatelyRender: false,
  }, [note]);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);


  // ─── Fetch note ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !noteId) return;
    let mounted = true;

    const fetchNote = async () => {
      setIsLoading(true);
      try {
        const data = await api.getNoteById(noteId);
        if (mounted) {
          setNote(data);
          setTitle(data.title || "");
          setTags(data.tags || []);
          lastUpdatedAtRef.current = data.updatedAt;
          // Track in recent notes (localStorage)
          try {
            const key = "neuronix:recent";
            const prev = JSON.parse(localStorage.getItem(key) || "[]") as string[];
            localStorage.setItem(key, JSON.stringify([noteId, ...prev.filter(id => id !== noteId)].slice(0, 8)));
          } catch { }
        }
      } catch {
        toast.error("Failed to load note");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchNote();
    return () => { mounted = false; };
  }, [noteId, isLoaded, isSignedIn]);

  // ─── Auto-save ────────────────────────────────────────────────────────────

  const handleAutoSave = useDebouncedCallback(async (
    newTitle: string,
    newContent?: any,
    newTextContent?: string,
    newTags?: string[]
  ) => {
    if (!noteId) return;

    // Cancel previous in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setSaveStatus('saving');
    try {
      const updated = await api.updateNote(noteId, {
        title: newTitle,
        content: newContent,
        textContent: newTextContent,
        tags: newTags,
        lastUpdatedAt: lastUpdatedAtRef.current,
      });
      if (!signal.aborted) {
        lastUpdatedAtRef.current = updated.updatedAt;
        setSaveStatus('saved');
        // Revert to idle after 2s so indicator fades out
        setTimeout(() => setSaveStatus(s => s === 'saved' ? 'idle' : s), 2000);
      }
    } catch (err: any) {
      // Silently ignore stale updates and aborted requests — UI is source of truth
      if (err.message === "STALE_UPDATE" || err.name === "AbortError") return;
      if (!signal.aborted) {
        setSaveStatus('error');
        toast.error("Auto-save failed. Your work is preserved locally.");
        setTimeout(() => setSaveStatus('idle'), 4000);
      }
    }
  }, 1000);

  // ─── Tag handlers ─────────────────────────────────────────────────────────

  const handleAddTag = useCallback((tag: string) => {
    if (!editor) return;
    const next = [...(tags || []), tag];
    setTags(next);
    handleAutoSave(title, editor.getJSON(), editor.getText(), next);
  }, [tags, title]);

  const handleRemoveTag = useCallback((tag: string) => {
    if (!editor) return;
    const next = (tags || []).filter(t => t !== tag);
    setTags(next);
    handleAutoSave(title, editor.getJSON(), editor.getText(), next);
  }, [tags, title]);

  // ─── File Upload ────────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    // Optional: reset input
    e.target.value = '';

    const toastId = toast.loading("Uploading...");
    try {
      const response = await api.uploadFile(file);

      if (response.type.startsWith("image/")) {
        editor.chain().focus().setImage({ src: response.url }).run();
        toast.success(`${file.name} uploaded`, { id: toastId });
      } else {
        toast.error("Only image files are supported", { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload file", { id: toastId });
    }
  };

  // ─── Slash command handler ─────────────────────────────────────────────────

  const filteredSlashCommands = SLASH_COMMANDS.filter(c =>
    !slashMenu.query || c.label.toLowerCase().includes(slashMenu.query.toLowerCase()) || c.id.includes(slashMenu.query.toLowerCase())
  );

  // ─── Debug: log editor state on change ────────────────────────────────────
  useEffect(() => {
    if (editor) {
      console.log("EDITOR JSON:", editor.getJSON());
    }
  }, [editor]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTitle(v);
    if (!editor) return;
    handleAutoSave(v, editor.getJSON(), editor.getText(), tags);
  };

  // ─── Guards ───────────────────────────────────────────────────────────────

  if (isLoaded && !isSignedIn) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-center p-8">
        <div>
          <h3 className="text-xl font-medium text-slate-200 mb-2">Unauthorized</h3>
          <p className="text-slate-500">You must be signed in to view this note.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-8 md:p-16 max-w-4xl mx-auto w-full animate-pulse">
        <div className="h-3 w-32 bg-white/5 rounded mb-6" />
        <div className="h-12 w-3/4 bg-white/5 rounded-xl mb-4" />
        <div className="flex gap-2 mb-10">
          <div className="h-6 w-16 bg-white/5 rounded-md" />
          <div className="h-6 w-20 bg-white/5 rounded-md" />
        </div>
        <div className="space-y-3 border-t border-white/5 pt-8">
          {[1, 0.9, 0.7, 1, 0.8, 0.6].map((w, i) => (
            <div key={i} className="h-4 bg-white/5 rounded" style={{ width: `${w * 100}%` }} />
          ))}
        </div>
      </div>
    );
  }

  // ─── Default empty state ──────────────────────────────────────────────────

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-center p-8">
        <div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">Note not found</h3>
          <p className="text-slate-600 text-sm">It may have been deleted or moved.</p>
        </div>
      </div>
    );
  }

  // ─── Editor render ────────────────────────────────────────────────────────

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Card-Based Editor Layout ── */}
      <div className="h-full flex flex-col">

        {/* Editor Card */}
        <div className="
          relative
          w-full
          h-full
          bg-[#0A0A0A]
          flex flex-col
          overflow-hidden
        ">

          {/* ── Save Indicator (Top Right, outside toolbar) ── */}
          <div className="absolute top-4 right-6 z-50 flex items-center gap-2">
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                Saving…
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-1.5 text-emerald-500 text-[11px] font-medium animate-in fade-in duration-300">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Saved
              </div>
            )}
            {saveStatus === 'editing' && (
              <div className="flex items-center gap-1.5 text-amber-500/70 text-[11px] font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/70" />
                Unsaved changes
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-1.5 text-red-400 text-[11px] font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Save failed
              </div>
            )}
            {saveStatus === 'idle' && (
              <div className="flex items-center gap-1.5 text-slate-700 text-[11px] font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                Auto-save on
              </div>
            )}
          </div>

          {/* ── Floating Glassmorphism Toolbar (centered pill, auto-hides) ── */}
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 transition-opacity duration-300 ${
              toolbarVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
          <div className="
            bg-white/5 backdrop-blur-xl
            border border-white/10
            rounded-xl px-3 py-2
            flex items-center gap-1
            shadow-lg shadow-black/40
          ">
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} isActive={!!editor?.isActive("heading", { level: 1 })} title="Heading 1">
              <Heading1 className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} isActive={!!editor?.isActive("heading", { level: 2 })} title="Heading 2">
              <Heading2 className="w-4 h-4" />
            </ToolbarBtn>

            <div className="w-px h-4 bg-white/10 mx-1.5" />

            <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} isActive={!!editor?.isActive("bold")} title="Bold">
              <Bold className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} isActive={!!editor?.isActive("italic")} title="Italic">
              <Italic className="w-4 h-4" />
            </ToolbarBtn>

            <div className="w-px h-4 bg-white/10 mx-1.5" />

            <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} isActive={!!editor?.isActive("bulletList")} title="Bullet List">
              <List className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} isActive={!!editor?.isActive("orderedList")} title="Numbered List">
              <ListOrdered className="w-4 h-4" />
            </ToolbarBtn>

            <div className="w-px h-4 bg-white/10 mx-1.5" />

            <ToolbarBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} isActive={!!editor?.isActive("blockquote")} title="Blockquote">
              <Quote className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor?.chain().focus().toggleCodeBlock().run()} isActive={!!editor?.isActive("codeBlock")} title="Code Block">
              <Code className="w-4 h-4" />
            </ToolbarBtn>

            <div className="w-px h-4 bg-white/10 mx-1.5" />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 rounded-lg transition-all active:scale-95"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Upload
            </button>
          </div>
          </div>

          {/* ── Title + Tags (Fixed, always visible) ── */}
          <div className="px-16 pt-16 pb-0 flex-shrink-0 max-w-7xl mx-auto w-full">
            <Breadcrumb note={note} />
            <input
              autoFocus
              type="text"
              id="note-title-input"
              className="w-full bg-transparent text-3xl md:text-4xl font-semibold tracking-tight text-white placeholder-slate-800 focus:outline-none leading-tight mt-1"
              placeholder="Untitled"
              value={title}
              onChange={handleTitleChange}
            />
            <div className="mt-3">
              <TagRow tags={tags} onAdd={handleAddTag} onRemove={handleRemoveTag} />
            </div>
          </div>
          {/* Single divider: below title+tags, above editor body */}
          <div className="mx-12 mt-5 border-b border-white/10" />

          {/* ── Scrollable Editor Area ONLY ── */}
          <div className="flex-1 overflow-y-auto editor-scroll px-16 pt-5 pb-10 max-w-7xl mx-auto w-full">
            <div
              ref={editorContainerRef}
              className="min-h-[400px] relative"
              onClick={(e) => {
                const target = e.target as HTMLElement;
                const img = target.closest("img");
                if (img && target.closest(".resizable-image-container")) {
                  setPreviewFile({
                    url: img.src,
                    name: img.alt || "Image Preview",
                    type: "image/jpeg",
                  });
                }
              }}
            >
              {editor && <EditorContent editor={editor} />}
            </div>

            {/* Slash command hint */}
            {!slashMenu.open && (
              <div className="text-[10px] text-slate-800 mt-12 select-none pt-4">
                Type <kbd className="border border-white/10 rounded px-1 bg-white/4 text-slate-700">/</kbd> for commands
              </div>
            )}
          </div>

          {/* ── Bottom Fade Gradient ── */}
          <div className="pointer-events-none absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#111111] to-transparent rounded-b-2xl z-10" />

        </div>
      </div>

      {/* ── Floating Selection Mini-Toolbar ── */}
      {selectionCoords && (
        <div
          className="fixed z-[999] flex items-center gap-0.5 px-2 py-1.5 rounded-xl bg-[#1a1a1f]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60 animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: selectionCoords.top,
            left: selectionCoords.left,
            transform: "translateX(-50%)",
          }}
          onMouseDown={(e) => e.preventDefault()} // keep selection alive
        >
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 ${editor?.isActive("bold") ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            title="Bold"
          >
            B
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold italic transition-all duration-150 active:scale-95 ${editor?.isActive("italic") ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            title="Italic"
          >
            I
          </button>
          <div className="w-px h-3.5 bg-white/10 mx-0.5" />
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150 active:scale-95 ${editor?.isActive("heading", { level: 1 }) ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150 active:scale-95 ${editor?.isActive("heading", { level: 2 }) ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            title="Heading 2"
          >
            H2
          </button>
          <div className="w-px h-3.5 bg-white/10 mx-0.5" />
          <button
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 ${editor?.isActive("blockquote") ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            title="Blockquote"
          >
            <Quote className="w-3 h-3" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleCode().run()}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 ${editor?.isActive("code") ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            title="Inline Code"
          >
            <Code className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── Slash Command Menu (fixed viewport coords) ── */}
      {slashMenu.open && filteredSlashCommands.length > 0 && (
        <div
          className="fixed z-[1000] bg-[#1e1e21] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden w-64"
          style={{ top: slashMenu.top, left: slashMenu.left }}
        >
          <div className="py-1">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-700 px-3 pt-2 pb-1">
              Blocks {slashMenu.query && `· "${slashMenu.query}"`}
            </p>
            {filteredSlashCommands.map((cmd, i) => (
              <button
                key={cmd.id}
                onMouseDown={(e) => { e.preventDefault(); applySlashCommand(cmd, editor); }}
                className={`w-full flex items-center gap-3 px-3 py-2 transition-colors text-left ${
                  slashMenu.selectedIndex === i
                    ? "bg-indigo-500/15 text-indigo-200"
                    : "text-slate-400 hover:bg-white/5"
                }`}
              >
                <span className={slashMenu.selectedIndex === i ? "text-indigo-400" : "text-slate-600"}>
                  {cmd.icon}
                </span>
                <div>
                  <div className="text-xs font-medium">{cmd.label}</div>
                  <div className="text-[10px] text-slate-600">{cmd.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="px-3 py-1.5 border-t border-white/5 text-[9px] text-slate-700">
            <kbd className="border border-white/10 rounded px-1">↑</kbd>{" "}
            <kbd className="border border-white/10 rounded px-1">↓</kbd> navigate ·{" "}
            <kbd className="border border-white/10 rounded px-1">↵</kbd> insert ·{" "}
            <kbd className="border border-white/10 rounded px-1">Esc</kbd> dismiss
          </div>
        </div>
      )}

      {/* ── Image Preview Modal ── */}
      {previewFile && previewFile.type.startsWith("image/") && (
        <div
          className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
          onClick={() => setPreviewFile(null)}
        >
          <button
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[5010]"
            onClick={() => setPreviewFile(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={previewFile.url}
              alt={previewFile.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center">
              <p className="text-white/70 text-sm font-medium tracking-wide">{previewFile.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Hidden File Input ── */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />
    </>
  );
}
