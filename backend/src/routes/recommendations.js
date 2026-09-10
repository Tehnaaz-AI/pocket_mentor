import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import Recommendation from '../models/Recommendation.js';
import Topic from '../models/Topic.js';
import Task from '../models/Task.js';
import StudyLog from '../models/StudyLog.js';
import { generateRecommendation, findSourceNoteForTopic } from '../services/recommendationService.js';
import { generateStudyKit, sanitizeQuizForClient } from '../services/studyKitService.js';
import { dbStore } from '../services/dbStore.js';
import { ID } from '../utils/ids.js';

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/recommendations/next   — "What should I do today?"
 * Returns the pending action, generating one on demand if there isn't one.
 * This is what the dashboard panel calls.
 */
router.get('/next', async (req, res) => {
  try {
    const existing = await Recommendation.findOne({
      userId: req.user._id,
      status: { $in: ['pending', 'started'] },
    }).sort({ generatedAt: -1 });

    if (existing) return res.json({ recommendation: existing, generated: false });

    const result = await generateRecommendation(req.user);
    return res.json({
      recommendation: result.recommendation,
      ranking: result.ranking,
      message: result.message,
      generated: true,
    });
  } catch (err) {
    console.error('Next best action error:', err);
    return res.status(500).json({ message: 'Failed to determine your next best action' });
  }
});

/** POST /api/recommendations/generate — force a fresh run of the priority engine. */
router.post('/generate', async (req, res) => {
  try {
    const result = await generateRecommendation(req.user);
    if (!result.recommendation) return res.json({ recommendation: null, message: result.message });
    return res.status(201).json({
      recommendation: result.recommendation,
      ranking: result.ranking,
      availableMinutes: result.availableMinutes,
      message: result.message,
    });
  } catch (err) {
    console.error('Recommendation generation error:', err);
    return res.status(500).json({ message: 'Failed to generate recommendation' });
  }
});

/** GET /api/recommendations — history, newest first. */
router.get('/', async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    const recommendations = await Recommendation.find(filter)
      .sort({ generatedAt: -1 })
      .limit(Math.min(Number(req.query.limit) || 25, 100));
    return res.json({ recommendations });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve recommendations' });
  }
});

/**
 * POST /api/recommendations/:id/start   — THE MERGE SEAM.
 *
 * Turns "study Dynamic Programming" into a real study workspace by handing the
 * topic's source notes to PocketMentor's existing kit generator. The student
 * lands in the same Study Workspace, with the same summary / 60-second summary
 * / flashcards / quiz they have always had.
 *
 * If the topic has no notes yet, this returns actionType 'import' with the
 * fields the importer needs pre-filled, instead of fabricating content.
 */
router.post('/:id/start', async (req, res) => {
  try {
    const recommendation = await Recommendation.findOne({ _id: req.params.id, userId: req.user._id });
    if (!recommendation) return res.status(404).json({ message: 'Recommendation not found' });

    // Already started and still valid — reopen the same workspace.
    if (recommendation.kitId) {
      return res.json({ sessionId: recommendation.kitId, recommendation, reopened: true });
    }

    const topic = await Topic.findOne({ _id: recommendation.topicId, userId: req.user._id });
    if (!topic) return res.status(404).json({ message: 'Topic no longer exists' });

    const note = recommendation.sourceNoteId
      ? await dbStore.getNoteById(recommendation.sourceNoteId)
      : await findSourceNoteForTopic(req.user._id, topic);

    if (!note) {
      return res.json({
        sessionId: null,
        actionType: 'import',
        recommendation,
        prefill: { subject: recommendation.subjectName || 'General', title: `${topic.name} Notes` },
        message: `No notes found for ${topic.name}. Import or paste your notes and Pocket Mentor will build the revision kit.`,
      });
    }

    // Reuse the ONE study-kit generator. No second study engine.
    const { sessionId, session, flashcards, quiz } = await generateStudyKit({
      userId: req.user._id,
      sourceText: note.extractedText,
      noteId: note._id,
      title: `${topic.name} — ${recommendation.estimatedMinutes} min focus`,
      subject: recommendation.subjectName || note.subject || 'General',
      // Weak topics get easier questions; strong ones get harder ones.
      difficulty: topic.masteryScore <= 3 ? 'Easy' : topic.masteryScore <= 6 ? 'Medium' : 'Hard',
      questionCount: 5,
      recommendationId: recommendation._id,
      focusTopics: [topic._id],
    });

    // Log the planned time so today's remaining budget stays honest.
    await StudyLog.create({
      _id: ID.studyLog(),
      userId: req.user._id,
      taskId: recommendation.taskId,
      topicId: topic._id,
      kitId: sessionId,
      plannedMinutes: recommendation.estimatedMinutes || 60,
      status: 'planned',
      startTime: new Date().toISOString(),
    });

    recommendation.status = 'started';
    recommendation.startedAt = new Date().toISOString();
    recommendation.kitId = sessionId;
    await recommendation.save();

    if (recommendation.taskId) {
      await Task.updateOne({ _id: recommendation.taskId }, { status: 'in-progress' });
    }

    return res.status(201).json({
      sessionId,
      actionType: 'study',
      recommendation,
      session,
      flashcards,
      quiz: sanitizeQuizForClient(quiz),
    });
  } catch (err) {
    console.error('Start recommendation error:', err);
    return res.status(500).json({ message: 'Failed to start the study session', error: err.message });
  }
});

/** PUT /api/recommendations/:id/complete — normally triggered by quiz submit. */
router.put('/:id/complete', async (req, res) => {
  try {
    const recommendation = await Recommendation.findOne({ _id: req.params.id, userId: req.user._id });
    if (!recommendation) return res.status(404).json({ message: 'Recommendation not found' });
    if (recommendation.status === 'completed') {
      return res.status(409).json({ message: 'This recommendation is already completed' });
    }

    const { actualMinutes, outcome } = req.body || {};
    const minutes = Number(actualMinutes) > 0 ? Number(actualMinutes) : recommendation.estimatedMinutes;
    const now = new Date().toISOString();

    recommendation.status = 'completed';
    recommendation.completedAt = now;
    await recommendation.save();

    if (recommendation.taskId) {
      await Task.updateOne({ _id: recommendation.taskId }, { status: 'completed', completedAt: now });
    }

    await StudyLog.updateOne(
      { userId: req.user._id, kitId: recommendation.kitId, status: 'planned' },
      { status: 'completed', actualMinutes: minutes, endTime: now, outcome: outcome || 'productive' }
    );

    return res.json({ recommendation, message: 'Recommendation completed' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to complete recommendation' });
  }
});

/** PUT /api/recommendations/:id/skip */
router.put('/:id/skip', async (req, res) => {
  try {
    const recommendation = await Recommendation.findOne({ _id: req.params.id, userId: req.user._id });
    if (!recommendation) return res.status(404).json({ message: 'Recommendation not found' });
    if (recommendation.status === 'completed') {
      return res.status(409).json({ message: 'A completed recommendation cannot be skipped' });
    }

    recommendation.status = 'skipped';
    await recommendation.save();
    if (recommendation.taskId) await Task.updateOne({ _id: recommendation.taskId }, { status: 'skipped' });

    // Release the study time this recommendation had reserved, otherwise it
    // keeps counting against today's budget and shrinks every later plan.
    if (recommendation.kitId) {
      await StudyLog.updateMany(
        { userId: req.user._id, kitId: recommendation.kitId, status: 'planned' },
        { status: 'missed' }
      );
    }

    return res.json({ recommendation, message: 'Recommendation skipped' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to skip recommendation' });
  }
});

export default router;
