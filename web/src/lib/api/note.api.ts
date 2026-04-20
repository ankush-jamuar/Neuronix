import { useAuth } from "@clerk/nextjs";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface NestedFolder {
  id: string;
  name: string;
  parentId: string | null;
  parent?: { id: string; name: string; parentId: string | null; parent?: { id: string; name: string } | null } | null;
}

export interface Note {
  id: string;
  title: string;
  content: any | null;
  textContent: string | null;
  isArchived: boolean;
  isFavorite: boolean;
  isDeleted: boolean;
  userId: string;
  folderId: string | null;
  folder?: NestedFolder | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  userId: string;
  parentId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useNoteApi = () => {
  const { getToken } = useAuth();

  const getHeaders = async () => {
    const token = await getToken({ template: 'default' });
    if (!token) throw new Error('UNAUTHORIZED_NO_TOKEN');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  // ─── Notes ──────────────────────────────────────────────────────────────────

  const getNotes = async (): Promise<Note[]> => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/notes`, { headers });
    if (!res.ok) throw new Error('Failed to fetch notes');
    return res.json();
  };

  const getNoteById = async (id: string): Promise<Note> => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/notes/${id}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch note');
    return res.json();
  };

  const createNote = async (data: { title: string; folderId?: string }): Promise<Note> => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.error || 'Failed to create note');
    }
    return res.json();
  };

  const updateNote = async (
    id: string,
    data: {
      title?: string;
      content?: any;
      textContent?: string;
      lastUpdatedAt?: string;
      isFavorite?: boolean;
      folderId?: string | null;
      tags?: string[];
    }
  ): Promise<Note> => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      if (res.status === 409) throw new Error('STALE_UPDATE');
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.error || 'Failed to update note');
    }
    return res.json();
  };

  const deleteNote = async (id: string): Promise<boolean> => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/notes/${id}`, { method: 'DELETE', headers });
    if (!res.ok) throw new Error('Failed to delete note');
    return true;
  };

  // ─── Folders ────────────────────────────────────────────────────────────────

  const getFolders = async (): Promise<Folder[]> => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/folders`, { headers });
    if (!res.ok) throw new Error('Failed to fetch folders');
    return res.json();
  };

  const createFolder = async (data: { name: string; parentId?: string }): Promise<Folder> => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/folders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create folder');
    return res.json();
  };

  const renameFolder = async (id: string, name: string): Promise<Folder> => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/folders/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to rename folder');
    return res.json();
  };

  const deleteFolder = async (id: string): Promise<boolean> => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/folders/${id}`, { method: 'DELETE', headers });
    if (!res.ok) throw new Error('Failed to delete folder');
    return true;
  };

  // ─── Uploads ────────────────────────────────────────────────────────────────

  const uploadFile = async (file: File): Promise<{ url: string; type: string; name: string }> => {
    const token = await getToken({ template: 'default' });
    if (!token) throw new Error('UNAUTHORIZED_NO_TOKEN');
    
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to upload file");
    }
    return res.json();
  };

  return {
    getNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
    getFolders,
    createFolder,
    renameFolder,
    deleteFolder,
    uploadFile,
  };
};
