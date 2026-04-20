"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Plus, Search, FileText, Trash2, Loader2, Star,
  Folder as FolderIcon, FolderOpen, ChevronDown, ChevronRight,
  Edit2, FolderPlus, FilePlus, Hash, X, Command, Tag, PanelLeftClose, PanelLeft
} from "lucide-react";
import { useNoteApi, Note, Folder } from "@/lib/api/note.api";
import CommandPalette from "@/components/notes/CommandPalette";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// ─── Tree Types ───────────────────────────────────────────────────────────────

interface FolderNode extends Folder {
  children: FolderNode[];
  notes: Note[];
}

// ─── Tree Builder ─────────────────────────────────────────────────────────────

function buildFolderTree(folders: Folder[], notes: Note[], parentId: string | null = null): FolderNode[] {
  return folders
    .filter(f => f.parentId === parentId)
    .map(f => ({
      ...f,
      children: buildFolderTree(folders, notes, f.id),
      notes: notes.filter(n => n.folderId === f.id),
    }));
}

// ─── NoteItem ─────────────────────────────────────────────────────────────────

const NoteItem = React.memo(({
  note, isActive, onDelete, onToggleFavorite, onRename, indentPx = 0, folderLabel
}: {
  note: Note;
  isActive: boolean;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite: (id: string, isFav: boolean, e: React.MouseEvent) => void;
  onRename: (id: string, newTitle: string) => void;
  indentPx?: number;
  folderLabel?: string;
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title || "Untitled");

  const handleRenameSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== note.title) onRename(note.id, trimmed);
    setIsRenaming(false);
  };

  const previewText = note.textContent
    ? note.textContent.length > 75 ? note.textContent.substring(0, 75) + "…" : note.textContent
    : null;

  const timeAgo = note.updatedAt
    ? formatDistanceToNow(new Date(note.updatedAt), { addSuffix: false })
    : null;

  return (
    <div className="relative group" style={{ paddingLeft: `${indentPx}px` }}>
      <Link
        href={`/dashboard/notes/${note.id}`}
        className={`flex flex-col rounded-lg px-2.5 py-2 transition-all text-sm ${
          isActive
            ? "bg-indigo-500/10 border border-indigo-500/25"
            : "border border-transparent hover:bg-white/4"
        }`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden w-[80%]">
          <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} className="flex-1" onClick={e => e.preventDefault()}>
              <input
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={() => handleRenameSubmit()}
                className="w-full bg-black/40 border border-indigo-500/50 rounded px-1 text-slate-200 outline-none text-xs"
              />
            </form>
          ) : (
            <span className={`truncate text-xs font-medium ${isActive ? "text-indigo-200" : "text-slate-300"}`}>
              {note.title || "Untitled"}
            </span>
          )}
        </div>
        {!isRenaming && (
          <div className="pl-5 flex items-center justify-between mt-0.5 gap-2">
            {previewText && <span className="text-[10px] text-slate-600 truncate flex-1">{previewText}</span>}
            {timeAgo && !previewText && <span className="text-[9px] text-slate-700 whitespace-nowrap">{timeAgo}</span>}
          </div>
        )}
        {/* Folder badge in search results */}
        {folderLabel && (
          <div className="pl-5 mt-0.5">
            <span className="text-[9px] text-slate-700 bg-white/5 px-1.5 py-0.5 rounded">{folderLabel}</span>
          </div>
        )}
      </Link>

      {/* Hover actions */}
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-1 top-1.5 bg-[#141416]/95 backdrop-blur-sm rounded-md border border-white/5 shadow-lg z-10">
        <button
          onClick={e => onToggleFavorite(note.id, note.isFavorite, e)}
          className="p-1 hover:bg-white/10 rounded text-slate-500 hover:text-yellow-400 transition-colors"
          title={note.isFavorite ? "Unfavorite" : "Favorite"}
        >
          <Star className={`w-3 h-3 ${note.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
        </button>
        <button
          onClick={e => { e.preventDefault(); setIsRenaming(true); }}
          className="p-1 hover:bg-white/10 rounded text-slate-500 hover:text-indigo-400 transition-colors"
          title="Rename"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={e => onDelete(note.id, e)}
          className="p-1 hover:bg-white/10 rounded text-slate-500 hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
});
NoteItem.displayName = "NoteItem";

// ─── FolderTreeNode ───────────────────────────────────────────────────────────

const FolderTreeNode = React.memo(({
  folder, depth, pathname,
  onDeleteNote, onToggleFavorite, onRenameNote,
  onCreateNote, onCreateFolder, onDeleteFolder, onRenameFolder,
}: {
  folder: FolderNode;
  depth: number;
  pathname: string;
  onDeleteNote: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite: (id: string, isFav: boolean, e: React.MouseEvent) => void;
  onRenameNote: (id: string, title: string) => void;
  onCreateNote: (folderId: string) => void;
  onCreateFolder: (parentId: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(folder.name);

  const hasContent = folder.notes.length > 0 || folder.children.length > 0;
  const isActive = folder.notes.some(n => pathname === `/dashboard/notes/${n.id}`);
  const indentPx = depth * 10;

  const handleRenameSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = editName.trim();
    if (trimmed && trimmed !== folder.name) onRenameFolder(folder.id, trimmed);
    setIsRenaming(false);
  };

  return (
    <div>
      <div
        className={`group relative flex items-center gap-1 rounded-lg py-1.5 px-1 transition-all hover:bg-white/5 ${isActive ? "bg-indigo-500/5" : ""}`}
        style={{ paddingLeft: `${indentPx + 4}px` }}
      >
        <button onClick={() => setIsExpanded(p => !p)} className="p-0.5 text-slate-700 hover:text-slate-400 transition-colors flex-shrink-0">
          {hasContent
            ? isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
            : <span className="w-3 h-3 inline-block" />
          }
        </button>

        {isExpanded
          ? <FolderOpen className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-indigo-400" : "text-indigo-500/60"}`} />
          : <FolderIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-indigo-400" : "text-indigo-500/60"}`} />
        }

        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="flex-1 ml-1" onClick={e => e.stopPropagation()}>
            <input
              autoFocus
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={() => handleRenameSubmit()}
              className="w-full bg-black/40 border border-indigo-500/50 rounded px-1 text-slate-200 outline-none text-xs"
            />
          </form>
        ) : (
          <button
            onClick={() => setIsExpanded(p => !p)}
            className={`flex-1 text-left text-xs font-medium truncate ml-1 transition-colors ${isActive ? "text-indigo-300" : "text-slate-300 hover:text-slate-100"}`}
          >
            {folder.name}
          </button>
        )}

        {!isRenaming && (
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5 flex-shrink-0 pr-0.5">
            <button onClick={() => onCreateNote(folder.id)} title="New note" className="p-0.5 hover:bg-white/10 rounded text-slate-600 hover:text-indigo-400 transition-colors">
              <FilePlus className="w-3 h-3" />
            </button>
            <button onClick={() => onCreateFolder(folder.id)} title="New subfolder" className="p-0.5 hover:bg-white/10 rounded text-slate-600 hover:text-indigo-400 transition-colors">
              <FolderPlus className="w-3 h-3" />
            </button>
            <button onClick={() => { setEditName(folder.name); setIsRenaming(true); }} title="Rename" className="p-0.5 hover:bg-white/10 rounded text-slate-600 hover:text-slate-200 transition-colors">
              <Edit2 className="w-3 h-3" />
            </button>
            <button onClick={() => onDeleteFolder(folder.id)} title="Delete" className="p-0.5 hover:bg-white/10 rounded text-slate-600 hover:text-red-400 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="border-l border-white/5" style={{ marginLeft: `${indentPx + 14}px` }}>
          {folder.children.map(child => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              pathname={pathname}
              onDeleteNote={onDeleteNote}
              onToggleFavorite={onToggleFavorite}
              onRenameNote={onRenameNote}
              onCreateNote={onCreateNote}
              onCreateFolder={onCreateFolder}
              onDeleteFolder={onDeleteFolder}
              onRenameFolder={onRenameFolder}
            />
          ))}
          {folder.notes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              isActive={pathname === `/dashboard/notes/${note.id}`}
              onDelete={onDeleteNote}
              onToggleFavorite={onToggleFavorite}
              onRename={onRenameNote}
              indentPx={4}
            />
          ))}
          {!hasContent && <p className="text-[10px] text-slate-700 italic py-1.5 pl-3">Empty</p>}
        </div>
      )}
    </div>
  );
});
FolderTreeNode.displayName = "FolderTreeNode";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SidebarSkeleton = () => (
  <div className="space-y-2 animate-pulse px-1">
    <div className="h-2.5 w-16 bg-white/5 rounded mb-4 ml-1" />
    {[100, 80, 90].map((w, i) => (
      <div key={i} className="h-10 bg-white/5 rounded-lg" style={{ width: `${w}%` }} />
    ))}
    <div className="h-2.5 w-12 bg-white/5 rounded mt-6 ml-1" />
    {[100, 85].map((w, i) => (
      <div key={i} className="h-10 bg-white/5 rounded-lg" style={{ width: `${w}%` }} />
    ))}
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = ({
  label,
  isOpen,
  onToggle,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className="flex items-center gap-1 w-full px-1 py-1 mb-0.5 group select-none"
  >
    {isOpen
      ? <ChevronDown className="w-2.5 h-2.5 text-slate-700 group-hover:text-slate-500 transition-colors" />
      : <ChevronRight className="w-2.5 h-2.5 text-slate-700 group-hover:text-slate-500 transition-colors" />
    }
    <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 group-hover:text-slate-400 transition-colors">
      {label}
    </span>
  </button>
);

// ─── Main Layout ──────────────────────────────────────────────────────────────

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Collapse state
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);
  const [isFoldersOpen, setIsFoldersOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(true);
  const [isTagsOpen, setIsTagsOpen] = useState(false);

  // Sidebar collapsed (Ctrl+B)
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Command palette
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // First-time hint
  const [showHint, setShowHint] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const api = useNoteApi();

  // Refs for keyboard focus shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  // Extract current note ID from pathname
  const currentNoteId = useMemo(() => {
    const match = pathname.match(/\/dashboard\/notes\/([^/]+)/);
    return match ? match[1] : undefined;
  }, [pathname]);

  // ─── Data fetching ─────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [fetchedNotes, fetchedFolders] = await Promise.all([
        api.getNotes().catch(() => []),
        api.getFolders().catch(() => []),
      ]);
      setNotes(fetchedNotes);
      setFolders(fetchedFolders);
    } catch {
      toast.error("Failed to load workspace");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) fetchData();
    const hintSeen = localStorage.getItem("neuronix:hint_seen");
    if (!hintSeen) setShowHint(true);
  }, [isLoaded, isSignedIn, fetchData]);

  const dismissHint = () => {
    setShowHint(false);
    localStorage.setItem("neuronix:hint_seen", "true");
  };

  // ─── Global keyboard shortcuts ────────────────────────────────────────────

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "k") { e.preventDefault(); setIsPaletteOpen(p => !p); return; }
      if (mod && e.key === "n" && !e.shiftKey && !isPaletteOpen) { e.preventDefault(); handleCreateNote(); return; }
      if (mod && e.key === "N" && e.shiftKey) { e.preventDefault(); handleCreateFolder(); return; }
      if (mod && e.key === "b") { e.preventDefault(); setSidebarOpen(p => !p); return; }
      if (mod && e.key === "/") { e.preventDefault(); searchInputRef.current?.focus(); return; }
      if (mod && e.key === "p" && !isPaletteOpen) { e.preventDefault(); setIsPaletteOpen(true); return; }
      if (mod && e.key === "1") { e.preventDefault(); sidebarRef.current?.focus(); return; }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPaletteOpen]);

  // ─── Derived data ──────────────────────────────────────────────────────────

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(n => n.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  // Folder name map for search result labels
  const folderNameMap = useMemo(
    () => Object.fromEntries(folders.map(f => [f.id, f.name])),
    [folders]
  );

  const filteredNotes = useMemo(() => {
    let result = notes;

    // Tag filter
    if (activeTags.length > 0) {
      result = result.filter(n =>
        activeTags.every(tag => n.tags?.includes(tag))
      );
    }

    // Search query (title + content + tags)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n =>
        (n.title || "").toLowerCase().includes(q) ||
        n.textContent?.toLowerCase().includes(q) ||
        n.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [notes, searchQuery, activeTags]);

  const favoriteNotes = useMemo(() => filteredNotes.filter(n => n.isFavorite), [filteredNotes]);
  const unassignedNotes = useMemo(() => filteredNotes.filter(n => !n.folderId), [filteredNotes]);
  const folderTree = useMemo(() => buildFolderTree(folders, filteredNotes), [folders, filteredNotes]);

  const isSearchMode = searchQuery.trim().length > 0 || activeTags.length > 0;
  const isEmpty = filteredNotes.length === 0 && !isLoading;
  const isWorkspaceEmpty = notes.length === 0 && folders.length === 0;

  const toggleActiveTag = useCallback((tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateNote = useCallback(async (folderId?: string) => {
    try {
      setIsCreating(true);
      const newNote = await api.createNote({ title: "Untitled", folderId });
      setNotes(prev => [newNote, ...prev]);
      router.push(`/dashboard/notes/${newNote.id}`);
    } catch {
      toast.error("Failed to create note");
    } finally {
      setIsCreating(false);
    }
  }, [api, router]);

  const handleDeleteNote = useCallback(async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNotes(prev => prev.filter(n => n.id !== id));
    try {
      await api.deleteNote(id);
      if (pathname === `/dashboard/notes/${id}`) router.push("/dashboard/notes");
    } catch {
      toast.error("Failed to delete note");
      fetchData();
    }
  }, [api, pathname, router, fetchData]);

  const handleToggleFavorite = useCallback(async (id: string, current: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isFavorite: !current } : n));
    try {
      await api.updateNote(id, { isFavorite: !current });
    } catch {
      toast.error("Failed to update favorite");
      setNotes(prev => prev.map(n => n.id === id ? { ...n, isFavorite: current } : n));
    }
  }, [api]);

  const handleRenameNote = useCallback(async (id: string, newTitle: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, title: newTitle } : n));
    try {
      await api.updateNote(id, { title: newTitle });
    } catch {
      toast.error("Failed to rename note");
      fetchData();
    }
  }, [api, fetchData]);

  const handleCreateFolder = useCallback(async (parentId?: string) => {
    try {
      const folder = await api.createFolder({ name: "New Folder", parentId });
      setFolders(prev => [...prev, folder]);
    } catch {
      toast.error("Failed to create folder");
    }
  }, [api]);

  const handleRenameFolder = useCallback(async (id: string, name: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
    try {
      await api.renameFolder(id, name);
    } catch {
      toast.error("Failed to rename folder");
      fetchData();
    }
  }, [api, fetchData]);

  const handleDeleteFolder = useCallback(async (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: null } : n));
    try {
      await api.deleteFolder(id);
    } catch {
      toast.error("Failed to delete folder");
      fetchData();
    }
  }, [api, fetchData]);

  // Delete note by ID directly (used from command palette without MouseEvent)
  const handleDeleteNoteById = useCallback(async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    try {
      await api.deleteNote(id);
      if (pathname === `/dashboard/notes/${id}`) router.push("/dashboard/notes");
    } catch {
      toast.error("Failed to delete note");
      fetchData();
    }
  }, [api, pathname, router, fetchData]);

  const handleMoveNote = useCallback(async (noteId: string, folderId: string | null) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, folderId } : n));
    try {
      await api.updateNote(noteId, { folderId });
    } catch {
      toast.error("Failed to move note");
      fetchData();
    }
  }, [api, fetchData]);

  const handleDuplicateNote = useCallback(async (noteId: string) => {
    try {
      const original = notes.find(n => n.id === noteId);
      if (!original) return;
      const copy = await api.createNote({ title: `${original.title || "Untitled"} (copy)`, folderId: original.folderId || undefined });
      await api.updateNote(copy.id, { content: original.content, textContent: original.textContent || "" });
      setNotes(prev => [{ ...copy, content: original.content, textContent: original.textContent }, ...prev]);
      router.push(`/dashboard/notes/${copy.id}`);
    } catch {
      toast.error("Failed to duplicate note");
    }
  }, [api, notes, router]);

  // ─── Auth guard ────────────────────────────────────────────────────────────

  if (isLoaded && !isSignedIn) {
    return (
      <div className="flex bg-[#111] border border-white/10 rounded-2xl overflow-hidden min-h-[calc(100vh-8rem)] items-center justify-center text-center p-8">
        <div>
          <h2 className="text-xl text-slate-200 mb-2 font-medium">Session Expired</h2>
          <p className="text-slate-500 text-sm">Please sign in again to access your workspace.</p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Command Palette */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        notes={notes}
        folders={folders}
        currentNoteId={currentNoteId}
        onCreateNote={handleCreateNote}
        onCreateFolder={handleCreateFolder}
        onDeleteNote={handleDeleteNoteById}
        onRenameNote={handleRenameNote}
        onToggleFavorite={handleToggleFavorite}
        onMoveNote={handleMoveNote}
        onDuplicateNote={handleDuplicateNote}
      />

      <div className="flex bg-[#111] border border-white/10 rounded-2xl overflow-hidden min-h-[calc(100vh-8rem)] relative shadow-2xl">

        {/* ── Sidebar ── */}
        <aside
          ref={sidebarRef}
          tabIndex={-1}
          className={`bg-[#141416] border-r border-white/5 flex flex-col flex-shrink-0 relative z-20 transition-all duration-200 focus:outline-none ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}
        >

          {/* Header */}
          <div className="sticky top-0 bg-[#141416]/95 backdrop-blur z-10 border-b border-white/5">
            <div className="flex items-center justify-between px-3 pt-3.5 pb-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Workspace</h3>
              <div className="flex items-center gap-0.5">
                {/* Cmd+K hint & Button */}
                <div className="relative">
                  <button
                    onClick={() => { setIsPaletteOpen(true); dismissHint(); }}
                    className="flex items-center gap-1 px-1.5 py-1 hover:bg-white/5 rounded-md text-slate-600 hover:text-slate-400 transition-colors"
                    title="Command Palette (Ctrl+K)"
                  >
                    <Command className="w-3 h-3" />
                    <span className="text-[9px]">K</span>
                  </button>
                  {showHint && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-max bg-indigo-500 text-white text-[10px] px-2 py-1.5 rounded shadow-lg shadow-indigo-500/20 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-500 rotate-45" />
                      <span className="font-semibold mr-2">Tip</span> Press <kbd className="bg-black/20 px-1 rounded mx-0.5">Ctrl</kbd> + <kbd className="bg-black/20 px-1 rounded mx-0.5">K</kbd> to open commands
                      <button onClick={e => { e.stopPropagation(); dismissHint(); }} className="ml-3 opacity-70 hover:opacity-100">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleCreateFolder()}
                  className="p-1.5 hover:bg-white/5 hover:text-indigo-400 rounded-lg text-slate-500 transition-colors"
                  title="New folder (Ctrl+Shift+N)"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleCreateNote()}
                  disabled={isCreating}
                  className="p-1.5 hover:bg-indigo-500/15 hover:text-indigo-400 rounded-lg text-slate-400 transition-colors"
                  title="New note (Ctrl+N)"
                >
                  {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 hover:bg-white/5 hover:text-slate-300 rounded-lg text-slate-500 transition-colors"
                  title="Close sidebar (Ctrl+B)"
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative px-3 pb-3">
              <Search className="w-3.5 h-3.5 absolute left-6 top-2 text-slate-600 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search… (Ctrl + /)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#1e1e20] border border-white/5 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/15 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-5 top-2 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Active tag filters */}
            {activeTags.length > 0 && (
              <div className="flex flex-wrap gap-1 px-3 pb-2.5">
                {activeTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleActiveTag(tag)}
                    className="flex items-center gap-1 text-[10px] bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 rounded-md px-1.5 py-0.5 hover:bg-indigo-500/25 transition-colors"
                  >
                    #{tag} <X className="w-2.5 h-2.5" />
                  </button>
                ))}
                <button
                  onClick={() => setActiveTags([])}
                  className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors px-1"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2.5 pb-12 space-y-1">
            {isLoading ? (
              <SidebarSkeleton />
            ) : isWorkspaceEmpty ? (
              /* ── True empty state ── */
              <div className="flex flex-col items-center justify-center mt-12 px-4 text-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-1">Your vault is empty</p>
                  <p className="text-slate-600 text-xs">Create your first note to get started</p>
                </div>
                <button
                  onClick={() => handleCreateNote()}
                  className="mt-1 text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Create first note
                </button>
              </div>
            ) : isSearchMode ? (
              /* ── Search / Filter results (flat list with folder labels) ── */
              filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center gap-2">
                  <Search className="w-5 h-5 text-slate-700" />
                  <p className="text-sm text-slate-600">No notes found</p>
                  <button
                    onClick={() => handleCreateNote()}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-1"
                  >
                    + Create new note
                  </button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <p className="text-[9px] text-slate-700 px-1 pb-1">
                    {filteredNotes.length} result{filteredNotes.length !== 1 ? "s" : ""}
                  </p>
                  {filteredNotes.map(note => (
                    <NoteItem
                      key={note.id}
                      note={note}
                      isActive={pathname === `/dashboard/notes/${note.id}`}
                      onDelete={handleDeleteNote}
                      onToggleFavorite={handleToggleFavorite}
                      onRename={handleRenameNote}
                      folderLabel={note.folderId ? folderNameMap[note.folderId] : undefined}
                    />
                  ))}
                </div>
              )
            ) : (
              /* ── Normal tree mode ── */
              <>
                {/* Favorites */}
                {favoriteNotes.length > 0 && (
                  <div>
                    <SectionHeader label="Favorites" isOpen={isFavoritesOpen} onToggle={() => setIsFavoritesOpen(p => !p)} />
                    {isFavoritesOpen && (
                      <div className="space-y-0.5 mb-2">
                        {favoriteNotes.map(note => (
                          <NoteItem
                            key={`fav-${note.id}`}
                            note={note}
                            isActive={pathname === `/dashboard/notes/${note.id}`}
                            onDelete={handleDeleteNote}
                            onToggleFavorite={handleToggleFavorite}
                            onRename={handleRenameNote}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Folder Tree */}
                {folderTree.length > 0 && (
                  <div>
                    <SectionHeader label="Folders" isOpen={isFoldersOpen} onToggle={() => setIsFoldersOpen(p => !p)} />
                    {isFoldersOpen && (
                      <div className="space-y-0.5 mb-2">
                        {folderTree.map(folder => (
                          <FolderTreeNode
                            key={folder.id}
                            folder={folder}
                            depth={0}
                            pathname={pathname}
                            onDeleteNote={handleDeleteNote}
                            onToggleFavorite={handleToggleFavorite}
                            onRenameNote={handleRenameNote}
                            onCreateNote={handleCreateNote}
                            onCreateFolder={handleCreateFolder}
                            onDeleteFolder={handleDeleteFolder}
                            onRenameFolder={handleRenameFolder}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Unassigned notes */}
                {unassignedNotes.length > 0 && (
                  <div>
                    <SectionHeader label="Notes" isOpen={isNotesOpen} onToggle={() => setIsNotesOpen(p => !p)} />
                    {isNotesOpen && (
                      <div className="space-y-0.5 mb-2">
                        {unassignedNotes.map(note => (
                          <NoteItem
                            key={note.id}
                            note={note}
                            isActive={pathname === `/dashboard/notes/${note.id}`}
                            onDelete={handleDeleteNote}
                            onToggleFavorite={handleToggleFavorite}
                            onRename={handleRenameNote}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tags section */}
                {allTags.length > 0 && (
                  <div className="border-t border-white/5 pt-2">
                    <SectionHeader label="Tags" isOpen={isTagsOpen} onToggle={() => setIsTagsOpen(p => !p)} />
                    {isTagsOpen && (
                      <div className="flex flex-wrap gap-1 px-1 pb-2">
                        {allTags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => toggleActiveTag(tag)}
                            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                              activeTags.includes(tag)
                                ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                                : "bg-white/4 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10"
                            }`}
                          >
                            <Hash className="w-2.5 h-2.5" />{tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        {/* ── Editor Panel ── */}
        <main className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden z-30 relative">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute top-4 left-4 z-50 p-2 bg-[#18181b] hover:bg-indigo-500/10 border border-white/10 rounded-lg text-slate-400 hover:text-indigo-400 transition-all shadow-lg hidden md:block"
              title="Open sidebar (Ctrl+B)"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
          {children}
        </main>
      </div>
    </>
  );
}
