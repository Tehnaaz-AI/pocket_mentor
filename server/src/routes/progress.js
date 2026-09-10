import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { dbStore } from '../services/dbStore.js';
import Recommendation from '../models/Recommendation.js';
import Deadline from '../models/Deadline.js';
import Goal from '../models/Goal.js';
import { daysUntil } from '../utils/dates.js';

const router = express.Router();
router.use(authMiddleware);

// GET /api/progress
router.get('/', async (req, res) => {
  try {
    const progress = await dbStore.getProgressByUser(req.user._id);
    return res.json({ progress });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve progress data' });
  }
});

// GET /api/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const progress = await dbStore.getProgressByUser(req.user._id);
    const sessions = await dbStore.getStudySessionsByUser(req.user._id);
    const notes = await dbStore.getNotesByUser(req.user._id);

    // Identify weak concepts from topics
    const weakTopics = Object.entries(progress.topics || {})
      .filter(([_, data]) => data.mastery === 'Needs Review')
      .map(([concept, data]) => ({
        concept,
        attempts: data.attempts,
        correct: data.correct,
        mastery: data.mastery
      }));

    const masteredTopics = Object.entries(progress.topics || {})
      .filter(([_, data]) => data.mastery === 'Mastered')
      .map(([concept, data]) => ({ concept, ...data }));

    const improvingTopics = Object.entries(progress.topics || {})
      .filter(([_, data]) => data.mastery === 'Improving')
      .map(([concept, data]) => ({ concept, ...data }));

    /* --- Academic OS additions -------------------------------------
     * Appended to the existing payload rather than served from a second
     * dashboard endpoint, so every field the current UI reads is untouched
     * and the new panel has what it needs from the same single request. */
    const [recommendation, upcomingDeadlines, activeGoals] = await Promise.all([
      Recommendation.findOne({ userId: req.user._id, status: { $in: ['pending', 'started'] } })
        .sort({ generatedAt: -1 }),
      Deadline.find({ userId: req.user._id, status: 'upcoming' }).sort({ dueDate: 1 }).limit(5),
      Goal.find({ userId: req.user._id, status: 'active' }).sort({ createdAt: -1 })
    ]);

    return res.json({
      streak: req.user.streak || progress.studyStreak || 1,
      totalKits: sessions.length,
      totalNotes: notes.length,
      averageScore: progress.averageScore || 0,
      totalQuizzes: progress.totalQuizzes || 0,
      weakTopics,
      improvingTopics,
      masteredTopics,
      recentSessions: sessions.slice(0, 5),
      recentNotes: notes.slice(0, 5),
      nextRevisionDue: weakTopics.length > 0 ? weakTopics[0].concept : (sessions[0]?.title || 'New Notes'),

      // --- additive: the Next Best Action layer ---
      nextBestAction: recommendation,
      activeGoals,
      dailyStudyMinutes: req.user.dailyStudyMinutes || 90,
      upcomingDeadlines: upcomingDeadlines.map(d => ({
        _id: d._id,
        title: d.title,
        type: d.type,
        dueDate: d.dueDate,
        priority: d.priority,
        daysRemaining: daysUntil(d.dueDate),
        isOverdue: daysUntil(d.dueDate) < 0
      }))
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return res.status(500).json({ message: 'Failed to fetch dashboard metrics' });
  }
});

export default router;
