import User from '../models/User.js';
import Note from '../models/Note.js';
import StudyKit from '../models/StudyKit.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import Topic from '../models/Topic.js';
import { normalizeKey } from '../utils/text.js';

/**
 * dbStore — MongoDB edition.
 *
 * This file used to read and rewrite server/data/store.json on every call.
 * It now runs on Mongoose while keeping EVERY method name and signature, so
 * the original route files in routes/*.js kept their logic unchanged during
 * the merge; the only edit they needed was `await` at each call site.
 *
 * (The flat file rewrote the entire database on every write, which meant two
 * concurrent requests could silently lose each other's data. That risk is gone.)
 *
 * TWO DELIBERATE CHANGES OF SUBSTANCE:
 *
 *  1. `progress` is no longer a stored document. getProgressByUser() now
 *     DERIVES the same response shape from Topic + Quiz + User, so there is a
 *     single source of truth for mastery while Progress.jsx and Dashboard.jsx
 *     keep receiving exactly the payload they already expect.
 *
 *  2. updateProgress() writes Topic documents. It is kept only so nothing that
 *     called it breaks; routes/quiz.js now calls performanceService directly
 *     because it has already resolved concepts to Topic documents.
 */
export const dbStore = {
  // ---------------------------------------------------------------- Users
  async getUserById(id) {
    return User.findById(id);
  },
  async getUserByEmail(email) {
    return User.findOne({ email: String(email ?? '').toLowerCase().trim() });
  },
  /** Password hashes are select:false, so ask for them explicitly to log in. */
  async getUserByEmailWithPassword(email) {
    return User.findOne({ email: String(email ?? '').toLowerCase().trim() }).select('+passwordHash');
  },
  async createUser(userData) {
    return User.create(userData);
  },
  async updateUser(id, updates) {
    return User.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
  },

  // ---------------------------------------------------------------- Notes
  async getNotesByUser(userId) {
    return Note.find({ userId }).sort({ createdAt: -1 });
  },
  async getNoteById(id) {
    return Note.findById(id);
  },
  async createNote(noteData) {
    return Note.create(noteData);
  },
  async deleteNote(id, userId) {
    const res = await Note.deleteOne({ _id: id, userId });
    return res.deletedCount > 0;
  },

  // ------------------------------------------------- Study kits (was sessions)
  async getStudySessionsByUser(userId) {
    return StudyKit.find({ userId }).sort({ createdAt: -1 });
  },
  async getStudySessionById(id) {
    return StudyKit.findById(id);
  },
  async createStudySession(sessionData) {
    return StudyKit.create(sessionData);
  },
  async updateStudySession(id, updates) {
    return StudyKit.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
  },

  // ----------------------------------------------------------- Flashcards
  async getFlashcardsBySession(sessionId) {
    return Flashcard.find({ sessionId });
  },
  async createFlashcards(cards) {
    if (!cards?.length) return [];
    return Flashcard.insertMany(cards);
  },
  async updateFlashcard(id, updates) {
    return Flashcard.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
  },

  // --------------------------------------------------------------- Quizzes
  async getQuizById(id) {
    return Quiz.findById(id);
  },
  async createQuiz(quizData) {
    return Quiz.create(quizData);
  },
  async updateQuiz(id, updates) {
    return Quiz.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
  },

  // ------------------------------------------------- Progress (now DERIVED)
  /**
   * Rebuilds 1.0's progress payload from the models that now own the data.
   * Field for field identical to what store.json used to hold:
   *   topics{name: {attempts, correct, mastery, lastStudied}}
   *   totalQuizzes · averageScore · studyStreak · lastActiveDate · history[]
   */
  async getProgressByUser(userId) {
    const [user, topics, quizzes] = await Promise.all([
      User.findById(userId),
      // createdAt breaks mastery ties deterministically, so the derived
      // weakTopics order (and dashboard.nextRevisionDue) is stable
      Topic.find({ userId }).sort({ masteryScore: 1, createdAt: 1 }),
      Quiz.find({ userId, attempted: true }).sort({ attemptedAt: -1 }).lean(),
    ]);

    const topicMap = {};
    for (const t of topics) {
      topicMap[t.name] = {
        attempts: t.attempts ?? 0,
        correct: t.correct ?? 0,
        mastery: t.masteryLabel(),
        lastStudied: t.lastPracticedAt,
        // extra fields the academic layer adds; additive, so existing readers
        // that only look at the four above are unaffected
        masteryScore: t.masteryScore,
        topicId: t._id,
      };
    }

    const history = quizzes
      .map((q) => ({
        date: q.attemptedAt,
        score: q.score,
        accuracy: q.accuracy,
        topic: q.topic || 'General',
      }))
      .reverse(); // oldest-first, as the stored history was

    const averageScore = history.length
      ? Math.round(history.reduce((s, h) => s + (h.accuracy ?? 0), 0) / history.length)
      : 0;

    return {
      _id: `prog_${userId}`,
      userId,
      topics: topicMap,
      totalQuizzes: history.length,
      averageScore,
      studyStreak: user?.streak ?? 1,
      lastActiveDate: history.length ? history[history.length - 1].date : user?.createdAt ?? null,
      history,
    };
  },

  /**
   * Legacy shim. Resolves concept strings to Topic documents and delegates to
   * performanceService, so old callers still work. New code should resolve
   * topics itself and call performanceService directly.
   */
  async updateProgress(userId, quizResult, topicResults = []) {
    const { applyQuizToTopics } = await import('./performanceService.js');

    const grouped = new Map();
    for (const r of topicResults) {
      const key = normalizeKey(r.concept || 'General');
      const bucket = grouped.get(key) || { concept: r.concept || 'General', total: 0, correct: 0 };
      bucket.total += 1;
      if (r.isCorrect) bucket.correct += 1;
      grouped.set(key, bucket);
    }

    const conceptResults = [];
    for (const [key, bucket] of grouped) {
      const topic = await Topic.findOne({ userId, $or: [{ nameKey: key }, { aliases: key }] });
      if (topic) conceptResults.push({ topic, total: bucket.total, correct: bucket.correct });
    }

    await applyQuizToTopics({ userId, conceptResults });
    return this.getProgressByUser(userId);
  },
};

export default dbStore;
