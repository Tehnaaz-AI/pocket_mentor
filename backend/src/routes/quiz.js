import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { dbStore } from '../services/dbStore.js';
import { aiService } from '../services/aiService.js';
import { resolveSubject, resolveTopics } from '../services/topicResolver.js';
import { applyQuizToTopics } from '../services/performanceService.js';
import Note from '../models/Note.js';
import StudyKit from '../models/StudyKit.js';
import Recommendation from '../models/Recommendation.js';
import Task from '../models/Task.js';
import StudyLog from '../models/StudyLog.js';
import { ID } from '../utils/ids.js';

const router = express.Router();
router.use(authMiddleware);

// POST /api/quiz/:id/submit
router.post('/:id/submit', async (req, res) => {
  try {
    const { answers = {} } = req.body; // e.g. { "q_1": 0, "q_2": 2 }
    const quiz = await dbStore.getQuizById(req.params.id);

    if (!quiz || quiz.userId !== req.user._id) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    /* ---------------------------------------------------------------
     * GRADING — unchanged from PocketMentor 1.0, and entirely
     * deterministic. No AI is involved in scoring.
     * --------------------------------------------------------------- */
    let correctCount = 0;
    const total = quiz.questions.length;
    const conceptDiagnostics = {}; // concept: { total: 0, correct: 0 }
    const gradedQuestions = [];
    const weakConcepts = [];

    quiz.questions.forEach(q => {
      const selected = answers[q.id];
      const isCorrect = selected === q.correctOption;
      if (isCorrect) correctCount++;

      const cName = q.concept || 'General';
      if (!conceptDiagnostics[cName]) {
        conceptDiagnostics[cName] = { total: 0, correct: 0 };
      }
      conceptDiagnostics[cName].total += 1;
      if (isCorrect) conceptDiagnostics[cName].correct += 1;

      gradedQuestions.push({
        id: q.id,
        question: q.question,
        options: q.options,
        correctOption: q.correctOption,
        selectedOption: selected,
        isCorrect,
        explanation: q.explanation,
        concept: q.concept,
        difficulty: q.difficulty
      });
    });

    // Detect weak concepts (accuracy < 100% on that concept)
    Object.entries(conceptDiagnostics).forEach(([concept, stats]) => {
      if (stats.correct < stats.total) {
        weakConcepts.push(concept);
      }
    });

    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    // Update Quiz state
    await dbStore.updateQuiz(quiz._id, {
      score: correctCount,
      total,
      accuracy,
      attempted: true,
      weakConcepts,
      submittedAnswers: answers,
      gradedQuestions,
      attemptedAt: new Date().toISOString()
    });

    /* ---------------------------------------------------------------
     * ACADEMIC STATE UPDATE — the merge point.
     *
     * The concept strings the AI produced are resolved to real Topic
     * documents (created on first sight), then mastery is updated on those
     * documents. This is what lets the priority engine reason about material
     * that came out of the student's own notes.
     *
     * Previously this line was dbStore.updateProgress(), which wrote a
     * separate progress document keyed by concept name. That store is gone —
     * GET /api/progress now derives the same payload from Topic + Quiz.
     * --------------------------------------------------------------- */
    const kit = quiz.sessionId ? await dbStore.getStudySessionById(quiz.sessionId) : null;
    const subject = await resolveSubject(req.user._id, kit?.subject || quiz.topic || 'General');
    const conceptNames = Object.keys(conceptDiagnostics);
    const topicsByConcept = await resolveTopics(req.user._id, conceptNames, subject._id);

    const conceptResults = [];
    for (const [concept, stats] of Object.entries(conceptDiagnostics)) {
      const topic = topicsByConcept.get(concept);
      if (topic) conceptResults.push({ topic, total: stats.total, correct: stats.correct });
    }

    const performanceChange = await applyQuizToTopics({
      userId: req.user._id,
      conceptResults
    });

    // Record which topics this material covers, so a future recommendation for
    // one of these topics can find source notes to build a fresh kit from.
    const topicIds = [...topicsByConcept.values()].map(t => t._id);
    if (topicIds.length && kit) {
      await StudyKit.updateOne(
        { _id: kit._id },
        { $addToSet: { topicIds: { $each: topicIds } }, subjectId: subject._id }
      );
      if (kit.noteId) {
        await Note.updateOne(
          { _id: kit.noteId },
          { $addToSet: { topicIds: { $each: topicIds } }, subjectId: subject._id }
        );
      }
      /* Close the loop if this quiz came from a Next Best Action.
       *
       * The recommendation, its task and its study log all have to be closed
       * together — completing only the recommendation leaves a phantom
       * "Focus on X" item stuck in the student's revision to-do list. */
      if (kit.recommendationId) {
        const rec = await Recommendation.findOne({
          _id: kit.recommendationId,
          userId: req.user._id,
          status: { $ne: 'completed' }
        });
        if (rec) {
          const now = new Date().toISOString();
          rec.status = 'completed';
          rec.completedAt = now;
          await rec.save();

          if (rec.taskId) {
            await Task.updateOne(
              { _id: rec.taskId, userId: req.user._id },
              { status: 'completed', completedAt: now }
            );
          }
          await StudyLog.updateOne(
            { userId: req.user._id, kitId: kit._id, status: 'planned' },
            { status: 'completed', endTime: now, outcome: accuracy >= 50 ? 'productive' : 'struggled' }
          );
        }
      }
    }

    /* Response: original fields unchanged, academic fields added. */
    return res.json({
      quizId: quiz._id,
      score: correctCount,
      total,
      accuracy,
      weakConcepts,
      gradedQuestions,
      conceptDiagnostics,
      // --- additive ---
      performanceChange,
      topicsUpdated: performanceChange.length
    });
  } catch (err) {
    console.error('Quiz submit error:', err);
    return res.status(500).json({ message: 'Failed to evaluate quiz' });
  }
});

// POST /api/quiz/:id/revise  — Revise Again, unchanged behaviour
router.post('/:id/revise', async (req, res) => {
  try {
    const quiz = await dbStore.getQuizById(req.params.id);
    if (!quiz || quiz.userId !== req.user._id) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const session = await dbStore.getStudySessionById(quiz.sessionId);
    const note = session ? await dbStore.getNoteById(session.noteId) : null;
    const noteText = note ? note.extractedText : (session?.summary || '');

    const weakConcepts = (quiz.weakConcepts && quiz.weakConcepts.length > 0)
      ? quiz.weakConcepts
      : (session?.keyConcepts?.slice(0, 2) || ['Core Concept']);

    // Generate targeted revision kit
    const reviseKit = await aiService.generateReviseAgainKit(noteText, weakConcepts);

    // Create a new revision quiz
    const newQuiz = {
      _id: ID.revisionQuiz(),
      sessionId: quiz.sessionId,
      userId: req.user._id,
      topic: `${quiz.topic} (Targeted Revision)`,
      questions: reviseKit.quizQuestions || [],
      score: null,
      accuracy: null,
      attempted: false,
      isRevision: true,
      weakConceptsTargeted: weakConcepts,
      createdAt: new Date().toISOString()
    };
    await dbStore.createQuiz(newQuiz);

    return res.json({
      revisionQuizId: newQuiz._id,
      focusExplanation: reviseKit.focusExplanation,
      memoryHooks: reviseKit.memoryHooks,
      targetedFlashcards: reviseKit.flashcards,
      quiz: {
        _id: newQuiz._id,
        topic: newQuiz.topic,
        questions: newQuiz.questions.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
          concept: q.concept,
          difficulty: q.difficulty
        }))
      }
    });
  } catch (err) {
    console.error('Revise again error:', err);
    return res.status(500).json({ message: 'Failed to create revision session' });
  }
});

export default router;
