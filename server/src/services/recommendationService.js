import Topic from '../models/Topic.js';
import Goal from '../models/Goal.js';
import Deadline from '../models/Deadline.js';
import Subject from '../models/Subject.js';
import Note from '../models/Note.js';
import Task from '../models/Task.js';
import StudyLog from '../models/StudyLog.js';
import Recommendation from '../models/Recommendation.js';
import { CONFIG, rankTopics, buildPlan, isWeakTopic } from '../utils/priorityCalculator.js';
import { buildTopicScoreHistory } from './performanceService.js';
import { startOfDay, endOfDay } from '../utils/dates.js';
import { normalizeKey, round } from '../utils/text.js';
import { ID } from '../utils/ids.js';

/**
 * THE NEXT BEST ACTION ENGINE.
 *
 * Answers "what should I study today, and why?" and then hands off to
 * PocketMentor's existing learning engine to answer "how?".
 *
 * Every number here is deterministic. The AI is never asked to rank anything.
 */

/* ------------------------------------------------------------------ *
 * Step 1 — load the academic state (parallel, index-backed queries)
 * ------------------------------------------------------------------ */
export async function loadAcademicState(userId) {
  const [topics, goals, deadlines, todaysLogs] = await Promise.all([
    Topic.find({ userId }),
    Goal.find({ userId }),
    Deadline.find({ userId, status: 'upcoming' }).sort({ dueDate: 1 }),
    StudyLog.find({
      userId,
      startTime: { $gte: startOfDay().toISOString(), $lte: endOfDay().toISOString() },
      status: { $in: ['planned', 'completed'] },
    }),
  ]);
  return { topics, goals, deadlines, todaysLogs };
}

/** Minutes the student can still commit today. */
export function availableMinutesToday(user, todaysLogs = []) {
  const budget = user.dailyStudyMinutes ?? 90;
  const committed = todaysLogs.reduce(
    (sum, l) => sum + Math.max(l.actualMinutes ?? 0, l.status === 'planned' ? l.plannedMinutes ?? 0 : 0),
    0
  );
  return Math.max(0, budget - committed);
}

/**
 * Step 6 — find source notes for a topic.
 *
 * This is the join that makes the merge real. The engine picks a topic by
 * name; the learning engine needs note TEXT to build a kit from. Notes get
 * tagged with topicIds when a quiz reveals which concepts they cover, so this
 * looks the topic up directly, then falls back to its subject.
 *
 * When nothing is found the recommendation becomes an "import" action rather
 * than inventing study material out of thin air.
 */
export async function findSourceNoteForTopic(userId, topic) {
  const direct = await Note.findOne({ userId, topicIds: topic._id }).sort({ createdAt: -1 });
  if (direct) return direct;

  if (topic.subjectId) {
    const bySubject = await Note.findOne({ userId, subjectId: topic.subjectId }).sort({ createdAt: -1 });
    if (bySubject) return bySubject;
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Step 8 — human-readable reasoning.
 * Templated, not generated: instant, offline, and identical on every run,
 * which is what you want when it is on screen in front of someone.
 * ------------------------------------------------------------------ */
export function buildReasoning({ best, availableMinutes, dailyBudget, plannedMinutes, actionType }) {
  const { topic, factors, evidence } = best;
  const clauses = [];

  if (factors.weakness >= 5) clauses.push(`its mastery is low (${round(topic.masteryScore, 1)}/10)`);
  else if (factors.weakness > 0) clauses.push(`there is still room to improve (mastery ${round(topic.masteryScore, 1)}/10)`);

  if (factors.recentFailure > 0 && evidence.recentAssessments.length) {
    const scores = evidence.recentAssessments.map((a) => `${Math.round(a.percentage)}%`).join(', ');
    const failed = evidence.recentAssessments.filter((a) => a.percentage < CONFIG.FAIL_THRESHOLD).length;
    clauses.push(
      failed > 1
        ? `your recent quizzes show repeated difficulty (last ${evidence.recentAssessments.length}: ${scores})`
        : `your most recent quiz on it was weak (${scores})`
    );
  }

  if (factors.goalRelevance > 0 && evidence.matchedGoal) {
    clauses.push(`it is relevant to your active goal "${evidence.matchedGoal.title}"`);
  }

  if (factors.deadlineUrgency > 0 && evidence.matchedDeadline) {
    const d = evidence.daysUntilDeadline;
    const when = d <= 0 ? 'is due today or overdue' : d === 1 ? 'is due tomorrow' : `is ${d} days away`;
    clauses.push(`"${evidence.matchedDeadline.title}" ${when}`);
  }

  if (!clauses.length) clauses.push('it is the highest-scoring topic in your current academic state');

  const joined = clauses.length > 1
    ? `${clauses.slice(0, -1).join(', ')}, and ${clauses[clauses.length - 1]}`
    : clauses[0];

  const timeNote = availableMinutes <= 0
    ? `You have already used your ${dailyBudget}-minute study budget today, so this is a short ${plannedMinutes}-minute top-up.`
    : `Today's plan is fitted to the ${availableMinutes} minutes you have available.`;

  const closing = actionType === 'import'
    ? 'You have no notes for this topic yet — import or paste them and Pocket Mentor will build the summary, flashcards and quiz.'
    : 'Stronger topics are deprioritised because they do not need immediate intervention.';

  return `${topic.name} was selected because ${joined}. ${timeNote} ${closing}`;
}

/* ------------------------------------------------------------------ *
 * generateRecommendation
 * ------------------------------------------------------------------ */
export async function generateRecommendation(user) {
  const userId = user._id;
  const { topics, goals, deadlines, todaysLogs } = await loadAcademicState(userId);

  // Legitimate empty state, not an error: prompt onboarding instead of crashing.
  if (!topics.length) {
    return {
      recommendation: null,
      message: 'Import some notes and take a quiz first — Pocket Mentor learns your weak topics from your own material.',
    };
  }

  // recentFailure is DERIVED from graded quizzes, not a duplicate collection.
  const byKey = new Map();
  for (const t of topics) {
    byKey.set(t.nameKey, t);
    for (const a of t.aliases || []) byKey.set(a, t);
  }
  const lookup = (concept) => byKey.get(normalizeKey(concept)) || null;
  const scoreHistory = await buildTopicScoreHistory(userId, lookup);

  const available = availableMinutesToday(user, todaysLogs);

  const ranked = rankTopics({ topics, goals, deadlines, scoreHistory, availableMinutes: available });
  const best = ranked[0];
  const { topic, factors, priorityScore, evidence } = best;

  const { plan, totalMinutes } = buildPlan(topic, available);

  // Can the student act on this now, or do they need notes first?
  const sourceNote = await findSourceNoteForTopic(userId, topic);
  const actionType = sourceNote ? 'study' : 'import';

  const title = `Focus on ${topic.name}`;
  const description = plan.map((p) => `${p.minutes} min — ${p.label}`).join(' | ');
  const reasoning = buildReasoning({
    best, availableMinutes: available, dailyBudget: user.dailyStudyMinutes ?? 90,
    plannedMinutes: totalMinutes, actionType,
  });

  const task = await Task.create({
    _id: ID.task(),
    userId,
    goalId: evidence.matchedGoal ? evidence.matchedGoal._id : null,
    subjectId: topic.subjectId,
    topicId: topic._id,
    title,
    description,
    estimatedMinutes: totalMinutes,
    priority: priorityScore >= 35 ? 'high' : priorityScore >= 20 ? 'medium' : 'low',
    status: 'pending',
    dueDate: endOfDay().toISOString(),
    source: 'recommendation',
  });

  /* Keep exactly one live recommendation so "current" is unambiguous.
   *
   * Superseded recommendations must also RELEASE the study time they had
   * reserved: /start writes a 'planned' StudyLog, and if that log is left
   * behind it keeps counting against today's budget forever, so every later
   * recommendation collapses to the 15-minute minimum plan. */
  const superseded = await Recommendation.find({
    userId, status: { $in: ['pending', 'started'] },
  }).select('_id kitId taskId');

  if (superseded.length) {
    const kitIds = superseded.map((r) => r.kitId).filter(Boolean);
    const taskIds = superseded.map((r) => r.taskId).filter(Boolean);

    await Recommendation.updateMany(
      { _id: { $in: superseded.map((r) => r._id) } },
      { status: 'skipped' }
    );
    if (kitIds.length) {
      await StudyLog.updateMany(
        { userId, kitId: { $in: kitIds }, status: 'planned' },
        { status: 'missed' }
      );
    }
    // Retire the superseded engine-created tasks too, or the student's revision
    // to-do list fills up with one stale "Focus on X" item per regeneration.
    if (taskIds.length) {
      await Task.updateMany(
        { _id: { $in: taskIds }, userId, status: { $in: ['pending', 'in-progress'] } },
        { status: 'skipped' }
      );
    }
  }

  const subject = topic.subjectId ? await Subject.findById(topic.subjectId) : null;
  const recommendation = await Recommendation.create({
    _id: ID.recommendation(),
    userId,
    topicId: topic._id,
    subjectId: topic.subjectId,
    goalId: evidence.matchedGoal ? evidence.matchedGoal._id : null,
    taskId: task._id,
    topicName: topic.name,
    subjectName: subject ? subject.name : '',
    title,
    description,
    priorityScore,
    factors,
    reasoning,
    plan,
    estimatedMinutes: totalMinutes,
    availableMinutes: available,
    actionType,
    sourceNoteId: sourceNote ? sourceNote._id : null,
    status: 'pending',
    generatedAt: new Date().toISOString(),
  });

  return {
    recommendation,
    message: 'Next Best Action generated',
    availableMinutes: available,
    // The runner-up scores, so "Why this recommendation?" can show the ranking.
    ranking: ranked.slice(0, 5).map((r) => ({
      topic: r.topic.name,
      topicId: r.topic._id,
      masteryScore: r.topic.masteryScore,
      priorityScore: r.priorityScore,
      factors: r.factors,
      isWeak: r.evidence.isWeak,
    })),
  };
}

/** Weak-topic list, shared by the dashboard and the engine. */
export const findWeakTopics = (topics) =>
  topics.filter(isWeakTopic).sort((a, b) => (a.masteryScore ?? 5) - (b.masteryScore ?? 5));

export default {
  generateRecommendation,
  loadAcademicState,
  availableMinutesToday,
  findSourceNoteForTopic,
  findWeakTopics,
};
