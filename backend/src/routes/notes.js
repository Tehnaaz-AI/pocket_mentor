import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { extractionService } from '../services/extractionService.js';
import { dbStore } from '../services/dbStore.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Protect all note routes
router.use(authMiddleware);

// POST /api/notes/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { originalname, mimetype, buffer } = req.file;
    const extractedText = await extractionService.extractText(buffer, originalname, mimetype);

    if (!extractedText || extractedText.length < 20) {
      return res.status(400).json({ message: 'Could not extract sufficient text from file' });
    }

    const title = req.body.title || originalname.replace(/\.[^/.]+$/, '');
    const subject = req.body.subject || 'General';

    const note = {
      _id: 'note_' + uuidv4(),
      userId: req.user._id,
      title,
      subject,
      sourceType: originalname.split('.').pop().toLowerCase(),
      fileName: originalname,
      extractedText,
      wordCount: extractedText.split(/\s+/).length,
      createdAt: new Date().toISOString()
    };

    await dbStore.createNote(note);

    return res.status(201).json({
      note,
      message: 'Note uploaded and parsed successfully'
    });
  } catch (err) {
    console.error('File upload error:', err);
    return res.status(500).json({ message: 'Failed to process and extract file' });
  }
});

// POST /api/notes/paste
router.post('/paste', async (req, res) => {
  try {
    const { title, subject, text } = req.body;
    if (!text || text.trim().length < 20) {
      return res.status(400).json({ message: 'Please provide at least 20 characters of note text' });
    }

    const cleanedText = extractionService.cleanText(text);

    const note = {
      _id: 'note_' + uuidv4(),
      userId: req.user._id,
      title: title || 'Quick Notes - ' + new Date().toLocaleDateString(),
      subject: subject || 'General',
      sourceType: 'paste',
      extractedText: cleanedText,
      wordCount: cleanedText.split(/\s+/).length,
      createdAt: new Date().toISOString()
    };

    await dbStore.createNote(note);

    return res.status(201).json({
      note,
      message: 'Note saved successfully'
    });
  } catch (err) {
    console.error('Paste note error:', err);
    return res.status(500).json({ message: 'Failed to save note' });
  }
});

// GET /api/notes
router.get('/', async (req, res) => {
  try {
    const notes = await dbStore.getNotesByUser(req.user._id);
    return res.json({ notes });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve notes' });
  }
});

// GET /api/notes/:id
router.get('/:id', async (req, res) => {
  try {
    const note = await dbStore.getNoteById(req.params.id);
    if (!note || note.userId !== req.user._id) {
      return res.status(404).json({ message: 'Note not found' });
    }
    return res.json({ note });
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving note' });
  }
});

// DELETE /api/notes/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await dbStore.deleteNote(req.params.id, req.user._id);
    if (!deleted) {
      return res.status(404).json({ message: 'Note not found' });
    }
    return res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete note' });
  }
});

export default router;
