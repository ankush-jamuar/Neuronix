import { prisma } from '../lib/prisma';
import { Folder } from '@prisma/client';

export class FolderService {
  async getFoldersByUser(userId: string): Promise<Folder[]> {
    return prisma.folder.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: 'asc' }
    });
  }

  async createFolder(userId: string, name: string, parentId?: string): Promise<Folder> {
    const trimmedName = name.trim().substring(0, 100) || 'New Folder';
    return prisma.folder.create({
      data: {
        name: trimmedName,
        userId,
        parentId: parentId || null
      }
    });
  }

  async renameFolder(folderId: string, userId: string, name: string): Promise<Folder | null> {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId, isDeleted: false }
    });
    if (!folder) return null;

    const trimmedName = name.trim().substring(0, 100);
    if (!trimmedName) return null;

    return prisma.folder.update({
      where: { id: folderId },
      data: { name: trimmedName }
    });
  }

  async deleteFolder(folderId: string, userId: string): Promise<boolean> {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId, isDeleted: false }
    });

    if (!folder) return false;

    await prisma.folder.update({
      where: { id: folderId },
      data: { isDeleted: true }
    });

    return true;
  }
}
