import { Router } from 'express';
import { NoteController } from '../controllers/note.controller';
import { validate } from '../middlewares/validate';
import { createNoteSchema, updateNoteSchema } from '../validators/note.validator';

const router = Router();
const noteController = new NoteController();

router.get('/', noteController.getNotes);
router.get('/:id', noteController.getNoteById);
router.post('/', validate(createNoteSchema), noteController.createNote);
router.put('/:id', validate(updateNoteSchema), noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

export default router;
