import Topic from '../models/Topic.js';
import Subject from '../models/Subject.js';
import Quiz from '../models/Quiz.js';
import { clamp, round } from '../utils/text.js';
import { daysAgo } from '../utils/dates.js';

/**
 * TOPIC PERFORMANCE UPDATE — the merge point of the two loops.
 *
 * Before the merge, dbStore.updateProgress() wrote a progress document keyed by
 * concept name. Now the same quiz event updates Topic documents instead, and
 * the progress view is derived back out of them. One owner, one write path.
 *
 * The mastery formula is an exponential moving average toward the latest result:
 *
 *   target     = accuracy / 10                    (0-100%  ->  0-10)
 *   newMastery = (1 - ALPHA) * oldMastery + ALPHA * target
 *
 * ALPHA = 0.4 is responsive enough that one quiz visibly moves the needle but
 * damped enough that a single lucky result does not declare mastery. Entirely
 * deterministic — no AI touches a number here.
 */
export const PERFORMANCE_CONFIG = {
  ALPHA: 0.4,
  FAIL_THRESHOLD: 50,
  RECOVERY_THRESHOLD: 75,
  HISTORY_WINDOW_DAYS: 90,
};

/** Recomputes a subject's cached progress from its topics' mastery. */
export async function recomputeSubjectProgress(subjectId, userId) {
  if (!subjectId) return null;
  const topics = await Topic.find({ userId, subjectId }).select('masteryScore').lean();
  const progress = topics.length
    ? Math.round((topics.reduce((s, t) => s + (t.masteryScore ?? 0), 0) / topics.length) * 10)
    : 0;
  return Subject.findOneAndUpdate(
    { _id: subjectId, userId },
    { progress: clamp(progress, 0, 100) },
    { returnDocument: 'after' }
  );
}

/**
 * Applies one graded quiz to the topics it touched.
 *
 * `conceptResults` is [{ topic, total, correct }] where `topic` is a resolved
 * Topic document — the caller (routes/quiz.js) does the concept→Topic
 * resolution so this service never deals in strings.
 */
export async function applyQuizToTopics({ userId, conceptResults = [] }) {
  const { ALPHA, FAIL_THRESHOLD, RECOVERY_THRESHOLD } = PERFORMANCE_CONFIG;
  const changes = [];
  const subjectIds = new Set();

  for (const { topic, total, correct } of conceptResults) {
    if (!topic || !total) continue;

    const accuracy = Math.round((correct / total) * 100);
    const previousMastery = topic.masteryScore ?? 5;
    const target = accuracy / 10;
    const newMastery = clamp(round((1 - ALPHA) * previousMastery + ALPHA * target, 1), 0, 10);

    const previousFailureCount = topic.failureCount ?? 0;
    let failureCount = previousFailureCount;
    if (accuracy < FAIL_THRESHOLD) failureCount += 1;
    else if (accuracy >= RECOVERY_THRESHOLD) failureCount = Math.max(0, failureCount - 1);

    topic.masteryScore = newMastery;
    topic.attempts = (topic.attempts ?? 0) + total;
    topic.correct = (topic.correct ?? 0) + correct;
    topic.practiceCount = (topic.practiceCount ?? 0) + 1;
    topic.failureCount = failureCount;
    topic.lastPracticedAt = new Date().toISOString();
    topic.lastAssessmentScore = accuracy;
    await topic.save();

    if (topic.subjectId) subjectIds.add(topic.subjectId);

    changes.push({
      topicId: topic._id,
      concept: topic.name,
      accuracy,
      masteryBefore: previousMastery,
      masteryAfter: newMastery,
      masteryDelta: round(newMastery - previousMastery, 1),
      failureCountBefore: previousFailureCount,
      failureCountAfter: failureCount,
      mastery: topic.masteryLabel(),
      verdict: accuracy < FAIL_THRESHOLD ? 'failed' : accuracy >= RECOVERY_THRESHOLD ? 'strong' : 'passed',
    });
  }

  for (const subjectId of subjectIds) await recomputeSubjectProgress(subjectId, userId);

  return changes;
}

/** Applies one externally reported Assessment to its topic. */
export async function applyAssessmentToTopic({ userId, topic, percentage }) {
  const changes = await applyQuizToTopics({
    userId,
    conceptResults: [{ topic, total: 100, correct: Math.round(percentage) }],
  });
  return changes[0] ?? null;
}

/**
 * DERIVED per-topic score history, used by the engine's recentFailure factor.
 *
 * Rather than duplicating quiz results into a second collection, this walks the
 * student's graded quizzes newest-first and, for each one, computes the
 * accuracy restricted to the questions whose concept resolves to each topic.
 * Returns Map<topicId, [{ percentage, date, title }]> newest-first.
 */
export async function buildTopicScoreHistory(userId, topicsByNameKey) {
  const since = daysAgo(PERFORMANCE_CONFIG.HISTORY_WINDOW_DAYS).toISOString();
  const quizzes = await Quiz.find({ userId, attempted: true, attemptedAt: { $gte: since } })
    .sort({ attemptedAt: -1 })
    .lean();

  const history = new Map();

  for (const quiz of quizzes) {
    const perTopic = new Map(); // topicId -> {total, correct}

    for (const graded of quiz.gradedQuestions || []) {
      const topic = topicsByNameKey(graded.concept);
      if (!topic) continue;
      const bucket = perTopic.get(topic._id) || { total: 0, correct: 0 };
      bucket.total += 1;
      if (graded.isCorrect) bucket.correct += 1;
      perTopic.set(topic._id, bucket);
    }

    for (const [topicId, { total, correct }] of perTopic) {
      if (!history.has(topicId)) history.set(topicId, []);
      history.get(topicId).push({
        percentage: Math.round((correct / total) * 100),
        date: quiz.attemptedAt,
        title: quiz.topic,
      });
    }
  }

  return history;
}

export default {
  PERFORMANCE_CONFIG,
  applyQuizToTopics,
  applyAssessmentToTopic,
  recomputeSubjectProgress,
  buildTopicScoreHistory,
};
