import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { NoteService } from './src/services/note.service';

const prisma = new PrismaClient();
const noteService = new NoteService();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found.");
    return;
  }
  console.log("USER ID:", user.id);

  let note = await prisma.note.findFirst({ where: { userId: user.id } });
  if (!note) {
    note = await noteService.createNote(user.id, "Test Note");
    console.log("CREATED NOTE:", note.id);
  } else {
    console.log("EXISTING NOTE:", note.id);
  }

  // Simulate multiple rapid autosaves
  console.log("Simulating 3 rapid autosaves...");
  try {
    for (let i = 1; i <= 3; i++) {
      const updated = await noteService.updateNote(user.id, note.id, {
        title: `Updated Title ${i}`,
        textContent: `This is text content ${i}. We need embeddings!`,
        lastUpdatedAt: new Date(Date.now() - 10000).toISOString(), // Stale date on purpose
      });
      console.log(`Save ${i} successful. New title:`, updated.title);
    }
  } catch (err: any) {
    console.error("Save failed:", err.message);
  }

  const finalNote = await prisma.note.findUnique({ where: { id: note.id } });
  console.log("Final DB Note Title:", finalNote?.title);

  // Wait a bit for fire-and-forget embeddings to run
  console.log("Waiting 3s for embeddings to process...");
  await new Promise(resolve => setTimeout(resolve, 3000));
}

main().finally(() => prisma.$disconnect());
