"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useAuth } from "@clerk/nextjs";
import { useDebouncedCallback } from "use-debounce";
import { useNoteApi, Note } from "@/lib/api/note.api";
import { toast } from "sonner";
import {
  Loader2, Bold, Italic, List, ListOrdered, Quote, Code,
  Heading1, Heading2, Tag as TagIcon, X, ChevronRight,
  Heading3, Minus, UploadCloud
} from "lucide-react";

import Link from "next/link";

// ─── Slash Command Definitions ────────────────────────────────────────────────

const SLASH_COMMANDS = [
  { id: "h1", label: "Heading 1", desc: "Large section heading",    icon: <Heading1 className="w-4 h-4" />, apply: (e: any) => e.chain().focus().clearNodes().toggleHeading({ level: 1 }).run() },
  { id: "h2", label: "Heading 2", desc: "Medium section heading",   icon: <Heading2 className="w-4 h-4" />, apply: (e: any) => e.chain().focus().clearNodes().toggleHeading({ level: 2 }).run() },
  { id: "h3", label: "Heading 3", desc: "Small section heading",    icon: <Heading3 className="w-4 h-4" />, apply: (e: any) => e.chain().focus().clearNodes().toggleHeading({ level: 3 }).run() },
  { id: "code",  label: "Code Block",    desc: "Code with syntax",            icon: <Code  className="w-4 h-4" />, apply: (e: any) => e.chain().focus().clearNodes().toggleCodeBlock().run() },
  { id: "quote", label: "Blockquote",    desc: "Capture a quote",             icon: <Quote className="w-4 h-4" />, apply: (e: any) => e.chain().focus().clearNodes().toggleBlockquote().run() },
  { id: "list",  label: "Bullet List",   desc: "Simple unordered list",       icon: <List  className="w-4 h-4" />, apply: (e: any) => e.chain().focus().clearNodes().toggleBulletList().run() },
  { id: "ol",    label: "Numbered List", desc: "Ordered numbered list",        icon: <ListOrdered className="w-4 h-4" />, apply: (e: any) => e.chain().focus().clearNodes().toggleOrderedList().run() },
  { id: "divider", label: "Divider",     desc: "Horizontal rule",             icon: <Minus className="w-4 h-4" />, apply: (e: any) => e.chain().focus().setHorizontalRule().run() },
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
          className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md text-xs font-medium text-indigo-300 hover:bg-indigo-500/15 transition-colors"
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
    className={`p-1.5 rounded-lg transition-colors ${
      isActive
        ? "bg-indigo-500/20 text-indigo-300"
        : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
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
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const lastUpdatedAtRef = useRef<string | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          } catch {}
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

    setIsSaving(true);
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
      }
    } catch (err: any) {
      // Silently ignore stale updates and aborted requests — UI is source of truth
      if (err.message === "STALE_UPDATE" || err.name === "AbortError") return;
      toast.error("Auto-save failed. Your work is preserved locally.");
    } finally {
      if (!signal.aborted) setIsSaving(false);
    }
  }, 1000);

  // ─── Tag handlers ─────────────────────────────────────────────────────────

  const handleAddTag = useCallback((tag: string) => {
    const next = [...tags, tag];
    setTags(next);
    handleAutoSave(title, editor?.getJSON(), editor?.getText(), next);
  }, [tags, title]);

  const handleRemoveTag = useCallback((tag: string) => {
    const next = tags.filter(t => t !== tag);
    setTags(next);
    handleAutoSave(title, editor?.getJSON(), editor?.getText(), next);
  }, [tags, title]);

  // ─── File Upload ────────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: reset input
    e.target.value = '';

    const toastId = toast.loading("Uploading...");
    try {
      const response = await api.uploadFile(file);
      toast.success(`${file.name} uploaded`, { id: toastId });
      console.log("Upload Response:", response);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload file", { id: toastId });
    }
  };

  // ─── Slash command handler ─────────────────────────────────────────────────

  const filteredSlashCommands = SLASH_COMMANDS.filter(c =>
    !slashMenu.query || c.label.toLowerCase().includes(slashMenu.query.toLowerCase()) || c.id.includes(slashMenu.query.toLowerCase())
  );

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
    onUpdate: ({ editor }) => {
      const { state, view } = editor;
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

      handleAutoSave(title, editor.getJSON(), editor.getText(), tags);
    },
    immediatelyRender: false,
  }, [note]);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTitle(v);
    handleAutoSave(v, editor?.getJSON(), editor?.getText(), tags);
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0A0A]">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-10 gap-2">
        <div className="flex items-center gap-0.5 flex-wrap">
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} isActive={!!editor?.isActive("heading", { level: 1 })} title="Heading 1">
            <Heading1 className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} isActive={!!editor?.isActive("heading", { level: 2 })} title="Heading 2">
            <Heading2 className="w-4 h-4" />
          </ToolbarBtn>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} isActive={!!editor?.isActive("bold")} title="Bold">
            <Bold className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} isActive={!!editor?.isActive("italic")} title="Italic">
            <Italic className="w-4 h-4" />
          </ToolbarBtn>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} isActive={!!editor?.isActive("bulletList")} title="Bullet List">
            <List className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} isActive={!!editor?.isActive("orderedList")} title="Numbered List">
            <ListOrdered className="w-4 h-4" />
          </ToolbarBtn>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} isActive={!!editor?.isActive("blockquote")} title="Blockquote">
            <Quote className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleCodeBlock().run()} isActive={!!editor?.isActive("codeBlock")} title="Code Block">
            <Code className="w-4 h-4" />
          </ToolbarBtn>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <ToolbarBtn onClick={() => fileInputRef.current?.click()} isActive={false} title="Upload File">
            <UploadCloud className="w-4 h-4" />
          </ToolbarBtn>
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            accept=".jpg,.jpeg,.png,.pdf" 
            className="hidden" 
          />
        </div>

        {/* Save indicator */}
        <div className="flex-shrink-0 text-xs">
          {isSaving ? (
            <span className="flex items-center gap-1.5 text-slate-500 bg-white/5 px-2.5 py-1 rounded-md">
              <Loader2 className="w-3 h-3 animate-spin text-indigo-500" /> Saving
            </span>
          ) : (
            <span className="text-slate-600 px-2.5 py-1">Saved</span>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
        <div className="max-w-3xl mx-auto w-full px-8 md:px-12 pt-12 lg:pt-16">

          {/* Breadcrumb */}
          <Breadcrumb note={note} />

          {/* Title */}
          <input
            autoFocus
            type="text"
            className="w-full bg-transparent text-4xl md:text-5xl font-extrabold tracking-tight text-slate-100 placeholder-slate-700 focus:outline-none mb-5 leading-tight"
            placeholder="Untitled"
            value={title}
            onChange={handleTitleChange}
          />

          {/* Tags */}
          <TagRow tags={tags} onAdd={handleAddTag} onRemove={handleRemoveTag} />

          {/* Tiptap body */}
          <div ref={editorContainerRef} className="min-h-[400px] relative">
            {editor && <EditorContent editor={editor} />}
          </div>

          {/* Slash menu hint (shown while no / typed yet) */}
          {!slashMenu.open && (
            <div className="text-[10px] text-slate-700 mt-3 select-none">
              Type <kbd className="border border-white/10 rounded px-1 bg-white/4 text-slate-600">/</kbd> for commands
            </div>
          )}
        </div>
      </div>

      {/* ── Slash Command Menu (fixed viewport coords) ── */}
      {slashMenu.open && filteredSlashCommands.length > 0 && (
        <div
          className="fixed z-[300] bg-[#1e1e21] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden w-64"
          style={{ top: slashMenu.top, left: slashMenu.left }}
        >
          {filteredSlashCommands.length === 0 ? (
            <p className="text-xs text-slate-600 px-4 py-3">No matching commands</p>
          ) : (
            <div className="py-1">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-700 px-3 pt-2 pb-1">
                Blocks {slashMenu.query && `· "${slashMenu.query}"`}
              </p>
              {filteredSlashCommands.map((cmd, i) => (
                <button
                  key={cmd.id}
                  onMouseDown={e => { e.preventDefault(); applySlashCommand(cmd, editor); }}
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
          )}
          <div className="px-3 py-1.5 border-t border-white/5 text-[9px] text-slate-700">
            <kbd className="border border-white/10 rounded px-1">↑</kbd>{" "}
            <kbd className="border border-white/10 rounded px-1">↓</kbd> navigate ·{" "}
            <kbd className="border border-white/10 rounded px-1">↵</kbd> insert ·{" "}
            <kbd className="border border-white/10 rounded px-1">Esc</kbd> dismiss
          </div>
        </div>
      )}
    </div>
  );
}
