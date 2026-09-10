import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { aiService } from '../services/aiService.js';
import { dbStore } from '../services/dbStore.js';
import { generateStudyKit, sanitizeQuizForClient } from '../services/studyKitService.js';

const router = express.Router();
router.use(authMiddleware);

// POST /api/study/generate
// The original notes -> revision-kit endpoint. Behaviour is unchanged; the
// kit-building steps now live in studyKitService so the Next Best Action flow
// can reuse the exact same generator instead of growing a second one.
router.post('/generate', async (req, res) => {
  try {
    const {
      noteId,
      text,
      title = 'Study Session',
      subject = 'General',
      difficulty = 'Medium',
      questionCount = 5
    } = req.body;

    let sourceText = text;

    if (noteId) {
      const existingNote = await dbStore.getNoteById(noteId);
      if (existingNote && existingNote.userId === req.user._id) {
        sourceText = existingNote.extractedText;
      }
    }

    const { sessionId, session, flashcards, quiz } = await generateStudyKit({
      userId: req.user._id,
      sourceText,
      noteId: noteId || null,
      title,
      subject,
      difficulty,
      questionCount
    });

    return res.status(201).json({
      sessionId,
      session,
      flashcards,
      quiz: sanitizeQuizForClient(quiz)
    });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ message: err.message });
    }
    console.error('Study generation error:', err);
    return res.status(500).json({ message: 'Failed to generate study kit', error: err.message });
  }
});

// GET /api/study/:sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await dbStore.getStudySessionById(req.params.sessionId);
    if (!session || session.userId !== req.user._id) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    const note = await dbStore.getNoteById(session.noteId);
    const flashcards = await dbStore.getFlashcardsBySession(session._id);
    const quiz = await dbStore.getQuizById(session.quizId);

    // If quiz was not attempted yet, hide correctOption and explanation
    let sanitizedQuiz = null;
    if (quiz) {
      sanitizedQuiz = {
        _id: quiz._id,
        topic: quiz.topic,
        score: quiz.score,
        accuracy: quiz.accuracy,
        attempted: quiz.attempted,
        questions: quiz.questions.map(q => {
          if (quiz.attempted) return q;
          return {
            id: q.id,
            question: q.question,
            options: q.options,
            concept: q.concept,
            difficulty: q.difficulty
          };
        })
      };
    }

    return res.json({
      session,
      note,
      flashcards,
      quiz: sanitizedQuiz
    });
  } catch (err) {
    console.error('Get session error:', err);
    return res.status(500).json({ message: 'Error retrieving study session' });
  }
});

// POST /api/study/:sessionId/ask (Ask My Notes grounded Q&A)
router.post('/:sessionId/ask', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const session = await dbStore.getStudySessionById(req.params.sessionId);
    if (!session || session.userId !== req.user._id) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    const note = await dbStore.getNoteById(session.noteId);
    const noteText = note ? note.extractedText : session.summary;

    const answerData = await aiService.askMyNotes(noteText, query);
    return res.json(answerData);
  } catch (err) {
    console.error('Ask My Notes error:', err);
    return res.status(500).json({ message: 'Failed to answer question' });
  }
});

// POST /api/study/flashcards/:id/rate
router.post('/flashcards/:id/rate', async (req, res) => {
  try {
    const { rating } = req.body; // 'Easy', 'Medium', 'Hard'
    const validRatings = ['Easy', 'Medium', 'Hard'];
    if (!validRatings.includes(rating)) {
      return res.status(400).json({ message: 'Rating must be Easy, Medium, or Hard' });
    }

    const card = await dbStore.updateFlashcard(req.params.id, {
      mastery: rating,
      lastReviewedAt: new Date().toISOString()
    });

    if (!card) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    return res.json({ flashcard: card });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to rate flashcard' });
  }
});

export default router;
