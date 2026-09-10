import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Goal from '../models/Goal.js';
import Deadline from '../models/Deadline.js';
import Task from '../models/Task.js';
import Assessment from '../models/Assessment.js';
import User from '../models/User.js';
import { ID } from '../utils/ids.js';
import { normalizeKey, titleCase } from '../utils/text.js';
import { isValidDate, daysUntil } from '../utils/dates.js';
import { applyAssessmentToTopic } from '../services/performanceService.js';
import { findWeakTopics } from '../services/recommendationService.js';

const router = express.Router();
router.use(authMiddleware);

/**
 * The Academic State API: the inputs the priority engine needs that the
 * original app never captured — goals, deadlines and available study time —
 * plus read access to the subjects and topics that grow out of the student's
 * own notes.
 *
 * Every handler is scoped by `userId`, so one student can never read or write
 * another's records; a document that exists but is not yours returns 404
 * rather than 403, so the API never confirms someone else's id exists.
 */

/* ------------------------------------------------------- profile */
router.get('/profile', async (req, res) => {
  const u = req.user;
  res.json({
    profile: {
      id: u._id, name: u.name, email: u.email, streak: u.streak,
      college: u.college, course: u.course, year: u.year,
      dailyStudyMinutes: u.dailyStudyMinutes,
      preferredStudyStart: u.preferredStudyStart, preferredStudyEnd: u.preferredStudyEnd,
    },
  });
});

/** dailyStudyMinutes drives the timeFit factor, so this changes the plan. */
router.put('/profile', async (req, res) => {
  try {
    const allowed = ['name', 'college', 'course', 'year', 'dailyStudyMinutes', 'preferredStudyStart', 'preferredStudyEnd'];
    const updates = {};
    for (const k of allowed) if (req.body?.[k] !== undefined) updates[k] = req.body[k];

    Object.assign(req.user, updates);
    await req.user.save(); // save() so the schema's min/max and regex rules run
    const u = req.user;
    return res.json({
      profile: {
        id: u._id, name: u.name, email: u.email, streak: u.streak,
        college: u.college, course: u.course, year: u.year,
        dailyStudyMinutes: u.dailyStudyMinutes,
        preferredStudyStart: u.preferredStudyStart, preferredStudyEnd: u.preferredStudyEnd,
      },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join('; ') });
    }
    return res.status(500).json({ message: 'Failed to update profile' });
  }
});

/* ------------------------------------------------------- subjects */
router.get('/subjects', async (req, res) => {
  const subjects = await Subject.find({ userId: req.user._id }).sort({ name: 1 });
  res.json({ subjects });
});

router.post('/subjects', async (req, res) => {
  try {
    const name = titleCase(req.body?.name);
    if (!name) return res.status(400).json({ message: 'Subject name is required' });
    const nameKey = normalizeKey(name);

    const existing = await Subject.findOne({ userId: req.user._id, nameKey });
    if (existing) return res.status(409).json({ message: 'You already have a subject with that name' });

    const subject = await Subject.create({
      _id: ID.subject(), userId: req.user._id, name, nameKey,
      description: req.body?.description || '',
    });
    return res.status(201).json({ subject });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create subject' });
  }
});

/* ------------------------------------------------------- topics */
router.get('/topics', async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.subjectId) filter.subjectId = req.query.subjectId;

  let topics = await Topic.find(filter).sort({ masteryScore: 1, createdAt: 1 });
  if (String(req.query.weak) === 'true') topics = findWeakTopics(topics);

  res.json({
    topics: topics.map((t) => ({
      _id: t._id, name: t.name, subjectId: t.subjectId,
      masteryScore: t.masteryScore, mastery: t.masteryLabel(),
      attempts: t.attempts, correct: t.correct,
      practiceCount: t.practiceCount, failureCount: t.failureCount,
      lastPracticedAt: t.lastPracticedAt, lastAssessmentScore: t.lastAssessmentScore,
      source: t.source, tags: t.tags,
    })),
  });
});

router.post('/topics', async (req, res) => {
  try {
    const name = titleCase(req.body?.name);
    const { subjectId } = req.body || {};
    if (!name || !subjectId) return res.status(400).json({ message: 'name and subjectId are required' });

    // A topic can only hang off a subject you own.
    const subject = await Subject.findOne({ _id: subjectId, userId: req.user._id });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const nameKey = normalizeKey(name);
    const existing = await Topic.findOne({ userId: req.user._id, nameKey });
    if (existing) return res.status(409).json({ message: 'You already have a topic with that name' });

    const topic = await Topic.create({
      _id: ID.topic(), userId: req.user._id, subjectId, name, nameKey,
      masteryScore: req.body?.masteryScore ?? 5,
      tags: req.body?.tags || [], source: 'manual',
    });
    return res.status(201).json({ topic });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join('; ') });
    }
    return res.status(500).json({ message: 'Failed to create topic' });
  }
});

router.put('/topics/:id', async (req, res) => {
  try {
    const topic = await Topic.findOne({ _id: req.params.id, userId: req.user._id });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    if (req.body?.masteryScore !== undefined) topic.masteryScore = req.body.masteryScore;
    if (req.body?.tags !== undefined) topic.tags = req.body.tags;
    await topic.save();

    const { recomputeSubjectProgress } = await import('../services/performanceService.js');
    await recomputeSubjectProgress(topic.subjectId, req.user._id);

    return res.json({ topic });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join('; ') });
    }
    return res.status(500).json({ message: 'Failed to update topic' });
  }
});

/* ------------------------------------------------------- goals */
router.get('/goals', async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  res.json({ goals: await Goal.find(filter).sort({ createdAt: -1 }) });
});

router.post('/goals', async (req, res) => {
  try {
    if (!req.body?.title) return res.status(400).json({ message: 'Goal title is required' });
    if (req.body.targetDate && !isValidDate(req.body.targetDate)) {
      return res.status(400).json({ message: 'targetDate must be a valid date' });
    }
    // Only subjects you own can be attached to a goal.
    for (const id of req.body.subjects || []) {
      const owned = await Subject.findOne({ _id: id, userId: req.user._id });
      if (!owned) return res.status(404).json({ message: 'Subject not found' });
    }

    const goal = await Goal.create({
      _id: ID.goal(), userId: req.user._id,
      title: req.body.title, type: req.body.type || 'other',
      description: req.body.description || '',
      targetDate: req.body.targetDate || null,
      priority: req.body.priority || 'medium',
      status: req.body.status || 'active',
      subjects: req.body.subjects || [],
      tags: (req.body.tags || []).map((t) => String(t).toLowerCase()),
    });
    return res.status(201).json({ goal });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join('; ') });
    }
    return res.status(500).json({ message: 'Failed to create goal' });
  }
});

router.put('/goals/:id', async (req, res) => {
  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body || {},
    { returnDocument: 'after', runValidators: true }
  );
  if (!goal) return res.status(404).json({ message: 'Goal not found' });
  res.json({ goal });
});

router.delete('/goals/:id', async (req, res) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!goal) return res.status(404).json({ message: 'Goal not found' });
  res.json({ message: 'Goal deleted' });
});

/* ------------------------------------------------------- deadlines */
router.get('/deadlines', async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const deadlines = await Deadline.find(filter).sort({ dueDate: 1 });
  res.json({
    deadlines: deadlines.map((d) => ({
      ...d.toObject(),
      // computed at read time — no cron job needed to flip statuses
      daysRemaining: daysUntil(d.dueDate),
      isOverdue: d.status === 'upcoming' && daysUntil(d.dueDate) < 0,
    })),
  });
});

router.post('/deadlines', async (req, res) => {
  try {
    if (!req.body?.title) return res.status(400).json({ message: 'Deadline title is required' });
    if (!isValidDate(req.body?.dueDate)) return res.status(400).json({ message: 'dueDate must be a valid date' });

    if (req.body.subjectId) {
      const owned = await Subject.findOne({ _id: req.body.subjectId, userId: req.user._id });
      if (!owned) return res.status(404).json({ message: 'Subject not found' });
    }
    if (req.body.goalId) {
      const owned = await Goal.findOne({ _id: req.body.goalId, userId: req.user._id });
      if (!owned) return res.status(404).json({ message: 'Goal not found' });
    }

    const deadline = await Deadline.create({
      _id: ID.deadline(), userId: req.user._id,
      title: req.body.title, type: req.body.type || 'other',
      description: req.body.description || '',
      dueDate: new Date(req.body.dueDate).toISOString(),
      priority: req.body.priority || 'medium',
      status: req.body.status || 'upcoming',
      subjectId: req.body.subjectId || null,
      goalId: req.body.goalId || null,
      tags: (req.body.tags || []).map((t) => String(t).toLowerCase()),
    });
    return res.status(201).json({
      deadline: {
        ...deadline.toObject(),
        daysRemaining: daysUntil(deadline.dueDate),
        isOverdue: daysUntil(deadline.dueDate) < 0,
      },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join('; ') });
    }
    return res.status(500).json({ message: 'Failed to create deadline' });
  }
});

router.put('/deadlines/:id', async (req, res) => {
  const deadline = await Deadline.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id }, req.body || {},
    { returnDocument: 'after', runValidators: true }
  );
  if (!deadline) return res.status(404).json({ message: 'Deadline not found' });
  res.json({ deadline });
});

router.delete('/deadlines/:id', async (req, res) => {
  const deadline = await Deadline.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!deadline) return res.status(404).json({ message: 'Deadline not found' });
  res.json({ message: 'Deadline deleted' });
});

/* ------------------------------------------------------- tasks
 * Real storage for the revision to-do list, which previously lived only in
 * the browser's localStorage and so could never inform anything. */
router.get('/tasks', async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.status) {
    filter.status = req.query.status;
  } else {
    // Skipped tasks are history, not work. Ask for them explicitly.
    filter.status = { $ne: 'skipped' };
  }
  res.json({ tasks: await Task.find(filter).sort({ dueDate: 1, createdAt: -1 }).limit(100) });
});

router.post('/tasks', async (req, res) => {
  try {
    if (!req.body?.title) return res.status(400).json({ message: 'Task title is required' });
    const estimatedMinutes = Number(req.body.estimatedMinutes ?? 30);
    if (!(estimatedMinutes > 0)) return res.status(400).json({ message: 'estimatedMinutes must be greater than 0' });

    const task = await Task.create({
      _id: ID.task(), userId: req.user._id,
      title: req.body.title, description: req.body.description || '',
      estimatedMinutes, priority: req.body.priority || 'medium',
      topicId: req.body.topicId || null, subjectId: req.body.subjectId || null,
      dueDate: req.body.dueDate || null, source: 'manual',
    });
    return res.status(201).json({ task });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create task' });
  }
});

router.put('/tasks/:id', async (req, res) => {
  const updates = { ...(req.body || {}) };
  if (updates.status === 'completed') updates.completedAt = new Date().toISOString();
  if (updates.status && updates.status !== 'completed') updates.completedAt = null;

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id }, updates,
    { returnDocument: 'after', runValidators: true }
  );
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json({ task });
});

router.delete('/tasks/:id', async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json({ message: 'Task deleted' });
});

/* ------------------------------------------------------- assessments
 * Scores earned OUTSIDE the app only. In-app quizzes live in Quiz and are
 * never written here, so there is one source of truth per event. */
router.get('/assessments', async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.topicId) filter.topicId = req.query.topicId;
  res.json({ assessments: await Assessment.find(filter).sort({ date: -1 }).limit(50) });
});

router.post('/assessments', async (req, res) => {
  try {
    const { topicId, title, score, totalMarks } = req.body || {};
    if (!topicId || !title || score === undefined || totalMarks === undefined) {
      return res.status(400).json({ message: 'topicId, title, score and totalMarks are required' });
    }
    if (Number(totalMarks) <= 0) return res.status(400).json({ message: 'totalMarks must be greater than 0' });
    if (Number(score) < 0) return res.status(400).json({ message: 'Score cannot be negative' });
    if (Number(score) > Number(totalMarks)) {
      return res.status(400).json({ message: `Score (${score}) cannot exceed totalMarks (${totalMarks})` });
    }

    const topic = await Topic.findOne({ _id: topicId, userId: req.user._id });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    const assessment = await Assessment.create({
      _id: ID.assessment(), userId: req.user._id,
      subjectId: topic.subjectId, topicId,
      title, type: req.body.type || 'test',
      score: Number(score), totalMarks: Number(totalMarks),
      date: req.body.date || new Date().toISOString(),
    });

    const change = await applyAssessmentToTopic({
      userId: req.user._id, topic, percentage: assessment.percentage,
    });

    return res.status(201).json({ assessment, performanceChange: change });
  } catch (err) {
    return res.status(400).json({ message: err.message || 'Failed to record assessment' });
  }
});

export default router;
