"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, FileText, Folder as FolderIcon, Plus, FolderPlus,
  ArrowRight, Hash, Command, Star, Trash2, Edit2, CornerDownRight,
  Clock, Zap, Navigation, ChevronRight, FolderInput
} from "lucide-react";
import { Note, Folder } from "@/lib/api/note.api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemType = "action" | "note" | "folder" | "note-action";

interface CommandItem {
  id: string;
  type: ItemType;
  label: string;
  description?: string;
  meta?: string;
  badge?: string; // e.g. "⭐" or folder name
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface ParsedQuery {
  mode: "all" | "notes" | "tags" | "folders" | "command";
  raw: string;   // what the user typed
  query: string; // the actual search term after prefix
}

// ─── Query Parser ─────────────────────────────────────────────────────────────

function parseQuery(input: string): ParsedQuery {
  const raw = input;
  if (raw.startsWith(">")) return { mode: "command", raw, query: raw.substring(1).trim() };
  if (/^@notes\s/i.test(raw)) return { mode: "notes", raw, query: raw.substring(7) };
  if (/^@tags\s/i.test(raw)) return { mode: "tags", raw, query: raw.substring(6) };
  if (/^@folders\s/i.test(raw)) return { mode: "folders", raw, query: raw.substring(9) };
  return { mode: "all", raw, query: raw };
}

// ─── Highlight Matching Text ──────────────────────────────────────────────────

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.substring(0, idx)}
      <mark className="bg-indigo-500/30 text-indigo-200 rounded-sm not-italic font-semibold">
        {text.substring(idx, idx + query.length)}
      </mark>
      {text.substring(idx + query.length)}
    </>
  );
}

// ─── Recent Notes (localStorage) ─────────────────────────────────────────────

const RECENT_KEY = "neuronix:recent";
const MAX_RECENT = 6;

function getRecentIds(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  folders: Folder[];
  currentNoteId?: string;
  onCreateNote: (folderId?: string) => void;
  onCreateFolder: (parentId?: string) => void;
  onDeleteNote: (id: string) => void;
  onRenameNote: (id: string, newTitle: string) => void;
  onToggleFavorite: (id: string, isFav: boolean, e: React.MouseEvent) => void;
  onMoveNote: (noteId: string, folderId: string | null) => void;
  onDuplicateNote: (noteId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CommandPalette({
  isOpen, onClose, notes, folders, currentNoteId,
  onCreateNote, onCreateFolder,
  onDeleteNote, onRenameNote, onToggleFavorite, onMoveNote, onDuplicateNote,
}: CommandPaletteProps) {
  const router = useRouter();
  const [rawQuery, setRawQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Sub-mode: "move-folder" shows folder list for moving current note
  const [subMode, setSubMode] = useState<null | "move-folder" | "rename">(null);
  const [renameValue, setRenameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setRawQuery("");
      setSelectedIndex(0);
      setSubMode(null);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const parsed = useMemo(() => parseQuery(rawQuery), [rawQuery]);
  const q = parsed.query.trim().toLowerCase();

  // Folder name map
  const folderNameMap = useMemo(() =>
    Object.fromEntries(folders.map(f => [f.id, f.name])),
    [folders]
  );

  // Current note object
  const currentNote = useMemo(() =>
    currentNoteId ? notes.find(n => n.id === currentNoteId) : undefined,
    [currentNoteId, notes]
  );

  // Recent notes
  const recentNotes = useMemo(() => {
    const ids = getRecentIds();
    return ids.map(id => notes.find(n => n.id === id)).filter(Boolean) as Note[];
  }, [notes, isOpen]); // eslint-disable-line

  // ─── Sub-mode: Move to folder ──────────────────────────────────────────────

  const moveFolderItems = useMemo((): CommandItem[] => {
    if (subMode !== "move-folder" || !currentNoteId) return [];
    const folderItems: CommandItem[] = folders.map(f => ({
      id: `move-to-${f.id}`,
      type: "folder",
      label: f.name,
      description: `Move note to "${f.name}"`,
      icon: <FolderIcon className="w-4 h-4" />,
      action: () => { onMoveNote(currentNoteId, f.id); onClose(); },
    }));
    // Add "Move to root (no folder)"
    folderItems.unshift({
      id: "move-to-root",
      type: "folder",
      label: "No folder (root)",
      description: "Remove from all folders",
      icon: <FileText className="w-4 h-4" />,
      action: () => { onMoveNote(currentNoteId, null); onClose(); },
    });
    return folderItems.filter(f =>
      !q || f.label.toLowerCase().includes(q)
    );
  }, [subMode, currentNoteId, folders, onMoveNote, onClose, q]);

  // ─── Main items ────────────────────────────────────────────────────────────

  const items = useMemo((): CommandItem[] => {
    if (subMode === "move-folder") return moveFolderItems;

    // ── System commands (> prefix or "command" mode) ─────────────────────────
    const allCommands: CommandItem[] = [
      {
        id: "new-note",
        type: "action",
        label: "New Note",
        description: "Create a blank note",
        shortcut: "Ctrl+N",
        icon: <Plus className="w-4 h-4" />,
        action: () => { onCreateNote(); onClose(); },
      },
      {
        id: "new-folder",
        type: "action",
        label: "New Folder",
        description: "Create a new folder",
        shortcut: "Ctrl+Shift+N",
        icon: <FolderPlus className="w-4 h-4" />,
        action: () => { onCreateFolder(); onClose(); },
      },
      ...(currentNote ? [
        {
          id: "rename-note",
          type: "note-action" as ItemType,
          label: "Rename This Note",
          description: `Currently: "${currentNote.title || "Untitled"}"`,
          icon: <Edit2 className="w-4 h-4" />,
          action: () => {
            setSubMode("rename");
            setRenameValue(currentNote.title || "");
          },
        },
        {
          id: "toggle-fav",
          type: "note-action" as ItemType,
          label: currentNote.isFavorite ? "Remove from Favorites" : "Add to Favorites",
          description: "Toggle favorite status for this note",
          icon: <Star className={`w-4 h-4 ${currentNote.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />,
          action: () => {
            const fakeEvt = new MouseEvent("click") as unknown as React.MouseEvent;
            onToggleFavorite(currentNote.id, currentNote.isFavorite, fakeEvt);
            onClose();
          },
        },
        {
          id: "move-note",
          type: "note-action" as ItemType,
          label: "Move Note to Folder",
          description: "Select destination folder",
          icon: <FolderInput className="w-4 h-4" />,
          action: () => { setSubMode("move-folder"); setRawQuery(""); },
        },
        {
          id: "duplicate-note",
          type: "note-action" as ItemType,
          label: "Duplicate This Note",
          description: "Create a copy of the current note",
          icon: <CornerDownRight className="w-4 h-4" />,
          action: () => { onDuplicateNote(currentNote.id); onClose(); },
        },
        {
          id: "delete-note",
          type: "note-action" as ItemType,
          label: "Delete This Note",
          description: "Move current note to trash",
          icon: <Trash2 className="w-4 h-4" />,
          action: () => {
            onDeleteNote(currentNote.id);
            router.push("/dashboard/notes");
            onClose();
          },
        },
      ] : []),
    ];

    // No query: show default view (actions + recent)
    if (!rawQuery.trim()) {
      return allCommands;
    }

    // "@tags" mode
    if (parsed.mode === "tags") {
      const allTagSet = new Set<string>();
      notes.forEach(n => n.tags?.forEach(t => allTagSet.add(t)));
      return Array.from(allTagSet)
        .filter(t => !q || t.includes(q))
        .slice(0, 10)
        .map(tag => ({
          id: `tag-${tag}`,
          type: "action",
          label: `#${tag}`,
          description: `${notes.filter(n => n.tags?.includes(tag)).length} notes`,
          icon: <Hash className="w-4 h-4" />,
          action: () => onClose(),
        }));
    }

    // "@folders" mode
    if (parsed.mode === "folders") {
      return folders
        .filter(f => !q || f.name.toLowerCase().includes(q))
        .slice(0, 8)
        .map(f => ({
          id: f.id,
          type: "folder",
          label: f.name,
          description: `${notes.filter(n => n.folderId === f.id).length} notes`,
          icon: <FolderIcon className="w-4 h-4" />,
          action: () => onClose(),
        }));
    }

    // ">" command mode
    if (parsed.mode === "command") {
      return allCommands.filter(c =>
        c.label.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      );
    }

    // "@notes" or "all" mode: search notes (+ folders + commands)
    const matchedNotes: CommandItem[] = notes
      .filter(n =>
        !q ||
        (n.title || "").toLowerCase().includes(q) ||
        n.textContent?.toLowerCase().includes(q) ||
        n.tags?.some(t => t.toLowerCase().includes(q))
      )
      .slice(0, 10)
      .map(note => ({
        id: note.id,
        type: "note",
        label: note.title || "Untitled",
        description: note.textContent
          ? note.textContent.substring(0, 65) + (note.textContent.length > 65 ? "…" : "")
          : note.tags?.length ? note.tags.map(t => `#${t}`).join("  ") : "No content",
        meta: note.folderId ? folderNameMap[note.folderId] : undefined,
        badge: note.isFavorite ? "⭐" : undefined,
        icon: <FileText className="w-4 h-4" />,
        action: () => { router.push(`/dashboard/notes/${note.id}`); onClose(); },
      }));

    if (parsed.mode === "notes") return matchedNotes;

    const matchedCommands = allCommands.filter(c =>
      c.label.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    );

    return [...matchedCommands, ...matchedNotes];
  }, [
    rawQuery, parsed, q, subMode, moveFolderItems,
    notes, folders, folderNameMap, currentNote,
    onCreateNote, onCreateFolder, onDeleteNote, onToggleFavorite, onMoveNote, onDuplicateNote, onClose, router
  ]);

  // Clamp selectedIndex
  useEffect(() => {
    setSelectedIndex(p => Math.min(p, Math.max(0, items.length - 1)));
  }, [items]);

  // Auto-scroll
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (subMode === "rename") {
      if (e.key === "Escape") { setSubMode(null); return; }
      if (e.key === "Enter") {
        if (currentNoteId && renameValue.trim()) {
          onRenameNote(currentNoteId, renameValue.trim());
        }
        onClose();
        return;
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, items.length - 1)); break;
      case "ArrowUp": e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); break;
      case "Enter": e.preventDefault(); items[selectedIndex]?.action(); break;
      case "Escape":
        e.preventDefault();
        if (subMode) { setSubMode(null); setRawQuery(""); }
        else onClose();
        break;
    }
  }, [items, selectedIndex, subMode, onClose, currentNoteId, renameValue, onRenameNote]);

  if (!isOpen) return null;

  // ─── Sections ──────────────────────────────────────────────────────────────

  const isEmpty = rawQuery.trim() && items.length === 0 && subMode !== "rename";
  const actionItems = items.filter(i => i.type === "action");
  const noteActionItems = items.filter(i => i.type === "note-action");
  const noteItems = items.filter(i => i.type === "note");
  const folderItems = items.filter(i => i.type === "folder");

  // Mode label for header hint
  const modeLabel = subMode === "move-folder"
    ? "Select destination folder"
    : subMode === "rename"
      ? "Rename note"
      : parsed.mode === "tags" ? "@tags" 
      : parsed.mode === "folders" ? "@folders"
      : parsed.mode === "notes" ? "@notes"
      : parsed.mode === "command" ? "> commands"
      : null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative w-full max-w-[560px] bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Input bar ── */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/5">
          {subMode === "move-folder" && <FolderInput className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
          {subMode === "rename" && <Edit2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
          {!subMode && <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />}

          {/* Rename sub-mode: separate input */}
          {subMode === "rename" ? (
            <input
              autoFocus
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter new title…"
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={rawQuery}
              onChange={e => { setRawQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder={
                subMode === "move-folder"
                  ? "Filter folders…"
                  : "Search notes, > commands, @notes, @tags, @folders…"
              }
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
            />
          )}

          {/* Mode badge */}
          {modeLabel && (
            <span className="text-[10px] text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 rounded px-1.5 py-0.5 flex-shrink-0">
              {modeLabel}
            </span>
          )}

          {rawQuery && !subMode && (
            <button
              onClick={() => setRawQuery("")}
              className="text-[10px] text-slate-600 hover:text-slate-400 border border-white/10 rounded px-1.5 py-0.5 transition-colors flex-shrink-0"
            >
              Clear
            </button>
          )}
          {subMode && (
            <button
              onClick={() => { setSubMode(null); setRawQuery(""); }}
              className="text-[10px] text-slate-600 hover:text-slate-400 border border-white/10 rounded px-1.5 py-0.5 transition-colors flex-shrink-0"
            >
              Back
            </button>
          )}
        </div>

        {/* ── Results ── */}
        <div ref={listRef} className="max-h-[420px] overflow-y-auto overscroll-contain">
          {/* Default view tips */}
          {!rawQuery.trim() && !subMode && (
            <div className="flex flex-wrap items-center gap-4 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Discover</span>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300">@notes</kbd> notes</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300">@tags</kbd> tags</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300">@folders</kbd> folders</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300">&gt;</kbd> commands</span>
              </div>
            </div>
          )}

          {isEmpty && (
            <div className="flex flex-col items-center py-10 text-center gap-2">
              <Search className="w-5 h-5 text-slate-700" />
              <p className="text-sm text-slate-600">No results for &ldquo;{rawQuery}&rdquo;</p>
              <button
                onClick={() => { onCreateNote(); onClose(); }}
                className="mt-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                + Create new note
              </button>
            </div>
          )}

          {!isEmpty && (
            <div className="py-1.5">
              {/* Current note actions */}
              {noteActionItems.length > 0 && (
                <Section label="Note Actions">
                  {noteActionItems.map(item => (
                    <CommandRow key={item.id} item={item} q={q} isSelected={selectedIndex === items.indexOf(item)} onHover={() => setSelectedIndex(items.indexOf(item))} onClick={item.action} />
                  ))}
                </Section>
              )}

              {/* System actions */}
              {actionItems.length > 0 && (
                <Section label={rawQuery.trim() ? undefined : "Actions"}>
                  {actionItems.map(item => (
                    <CommandRow key={item.id} item={item} q={q} isSelected={selectedIndex === items.indexOf(item)} onHover={() => setSelectedIndex(items.indexOf(item))} onClick={item.action} />
                  ))}
                </Section>
              )}

              {/* Folders */}
              {folderItems.length > 0 && (
                <Section label={subMode === "move-folder" ? "Choose Folder" : "Folders"}>
                  {folderItems.map(item => (
                    <CommandRow key={item.id} item={item} q={q} isSelected={selectedIndex === items.indexOf(item)} onHover={() => setSelectedIndex(items.indexOf(item))} onClick={item.action} />
                  ))}
                </Section>
              )}

              {/* Recent notes (no query) */}
              {!rawQuery.trim() && recentNotes.length > 0 && (
                <Section label="Recent" icon={<Clock className="w-2.5 h-2.5" />}>
                  {recentNotes.map(note => {
                    const item: CommandItem = {
                      id: `recent-${note.id}`,
                      type: "note",
                      label: note.title || "Untitled",
                      description: note.textContent ? note.textContent.substring(0, 55) + "…" : "",
                      meta: note.folderId ? folderNameMap[note.folderId] : undefined,
                      badge: note.isFavorite ? "⭐" : undefined,
                      icon: <FileText className="w-4 h-4" />,
                      action: () => { router.push(`/dashboard/notes/${note.id}`); onClose(); },
                    };
                    return <CommandRow key={item.id} item={item} q="" isSelected={false} onHover={() => {}} onClick={item.action} />;
                  })}
                </Section>
              )}

              {/* Search results */}
              {noteItems.length > 0 && (
                <Section label={rawQuery.trim() ? `${noteItems.length} result${noteItems.length !== 1 ? "s" : ""}` : undefined}>
                  {noteItems.map(item => (
                    <CommandRow key={item.id} item={item} q={q} isSelected={selectedIndex === items.indexOf(item)} onHover={() => setSelectedIndex(items.indexOf(item))} onClick={item.action} />
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-[10px] text-slate-700">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="border border-white/10 rounded px-1">↑</kbd>{" "}
              <kbd className="border border-white/10 rounded px-1">↓</kbd>{" "}
              navigate
            </span>
            <span><kbd className="border border-white/10 rounded px-1">↵</kbd> select</span>
            <span><kbd className="border border-white/10 rounded px-1">Esc</kbd> {subMode ? "back" : "close"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function Section({ label, children, icon }: { label?: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div>
      {label && (
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
          {icon && <span className="text-slate-700">{icon}</span>}
          <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-700">{label}</p>
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Command Row ──────────────────────────────────────────────────────────────

function CommandRow({
  item, q, isSelected, onHover, onClick
}: {
  item: CommandItem;
  q: string;
  isSelected: boolean;
  onHover: () => void;
  onClick: () => void;
}) {
  const isDanger = item.id === "delete-note";
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        isSelected
          ? isDanger ? "bg-red-500/10" : "bg-indigo-500/10"
          : "hover:bg-white/[0.03]"
      }`}
    >
      <span className={`flex-shrink-0 transition-colors ${
        isSelected ? isDanger ? "text-red-400" : "text-indigo-400" : "text-slate-600"
      }`}>
        {item.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate transition-colors ${
          isSelected ? isDanger ? "text-red-300" : "text-indigo-200" : "text-slate-300"
        }`}>
          {q ? <HighlightMatch text={item.label} query={q} /> : item.label}
          {item.badge && <span className="ml-1.5 text-xs">{item.badge}</span>}
        </div>
        {item.description && (
          <div className="text-[11px] text-slate-600 truncate">{item.description}</div>
        )}
      </div>
      {item.meta && (
        <span className="text-[10px] text-slate-700 flex-shrink-0 hidden sm:flex items-center gap-1">
          <ChevronRight className="w-2.5 h-2.5" />{item.meta}
        </span>
      )}
      {item.shortcut && (
        <span className="flex-shrink-0 hidden sm:flex items-center gap-1 text-[10px] text-slate-600 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
          {item.shortcut.split("+").map((key, i, arr) => (
            <React.Fragment key={key}>
              <span>{key}</span>
              {i < arr.length - 1 && <span className="opacity-50">+</span>}
            </React.Fragment>
          ))}
        </span>
      )}
      {isSelected && (
        <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 ml-1 ${isDanger ? "text-red-600" : "text-indigo-600"}`} />
      )}
    </button>
  );
}
