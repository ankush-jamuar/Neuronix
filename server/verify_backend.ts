import { NoteService } from './src/services/note.service';
import { prisma } from './src/lib/prisma';

async function verify() {
  console.log('--- BACKEND RUNTIME VERIFICATION ---');
  
  // 1. Find a test user and note
  const user = await prisma.user.findFirst({ where: { isDeleted: false } });
  if (!user) {
    console.error('❌ No user found in database');
    return;
  }
  
  let note = await prisma.note.findFirst({ where: { userId: user.id, isDeleted: false } });
  if (!note) {
    console.log('Creating test note...');
    const service = new NoteService();
    note = await service.createNote(user.id, 'Verification Note');
  }
  
  console.log(`Testing note: ${note.id} (Title: ${note.title})`);
  console.log(`Current updatedAt: ${note.updatedAt.toISOString()}`);
  
  // 2. Simulate a STALE update (lastUpdatedAt in the past)
  const staleDate = new Date(Date.now() - 1000000).toISOString();
  console.log(`Incoming lastUpdatedAt: ${staleDate} (STALE)`);
  
  const service = new NoteService();
  try {
    const updated = await service.updateNote(user.id, note.id, {
      title: 'Verified Title Change',
      textContent: 'Updated content for embedding verification ' + Date.now(),
      lastUpdatedAt: staleDate
    });
    
    console.log('✅ Update succeeded despite stale timestamp!');
    console.log(`New Title: ${updated.title}`);
    console.log(`New updatedAt: ${updated.updatedAt.toISOString()}`);
    
    // 3. Verify Database Persistence
    const dbNote = await prisma.note.findUnique({ where: { id: note.id } });
    if (dbNote?.title === 'Verified Title Change') {
      console.log('✅ Database persistence verified!');
    } else {
      console.error('❌ Database persistence failed!');
    }
    
    // 4. Verify Embedding Regeneration (Fire-and-forget logs should appear)
    console.log('Waiting 3s for embedding pipeline to fire...');
    await new Promise(r => setTimeout(r, 3000));
    
  } catch (error: any) {
    console.error('❌ Update failed:', error.message);
    if (error.message === 'STALE_UPDATE') {
      console.error('🔥 CRITICAL FAILURE: STALE_UPDATE logic still exists!');
    }
  }
  
  process.exit(0);
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
