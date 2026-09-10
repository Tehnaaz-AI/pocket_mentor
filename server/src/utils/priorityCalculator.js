import { clamp, round } from './text.js';
import { daysUntil } from './dates.js';

/**
 * PRIORITY ENGINE
 * ===============
 * Priority Score = Weakness + Deadline Urgency + Goal Relevance
 *                + Recent Failure + Time Fit          (each 0-10, total 0-50)
 *
 * Flat sum, no hidden weights. Per the project document this is a transparent
 * prioritisation mechanism for a prototype, NOT a validated prediction model.
 *
 * Every constant lives in CONFIG so it can be inspected and tuned in one place.
 */
export const CONFIG = {
  MAX_FACTOR: 10,
  MAX_SCORE: 50,

  // --- recentFailure -----------------------------------------------------
  FAIL_THRESHOLD: 50,        // below this percentage counts as a failure
  SHAKY_THRESHOLD: 65,       // below this is "not solid yet"
  SEVERITY_MAX: 6,           // component A ceiling
  REPETITION_PER_FAIL: 2,    // component B: points per consecutive failure
  REPETITION_MAX_FAILS: 2,   // component B caps at 2 fails => 4 points
  ASSESSMENT_LOOKBACK_DAYS: 60,
  RECENT_WINDOW: 3,          // how many recent attempts the reasoning quotes

  // --- deadlineUrgency: explicit day bands, no date library --------------
  URGENCY_BANDS: [
    { maxDays: 0, score: 10 },  // due today or already overdue
    { maxDays: 1, score: 9 },
    { maxDays: 3, score: 8 },
    { maxDays: 7, score: 6 },
    { maxDays: 14, score: 4 },
    { maxDays: 30, score: 2 },
  ],
  URGENCY_FAR_AWAY: 1,        // more than 30 days out
  URGENCY_NONE: 0,            // no deadline relevant to this topic

  // --- goalRelevance -----------------------------------------------------
  GOAL_SUBJECT_MATCH: 10,     // topic's subject is explicitly listed on the goal
  GOAL_TAG_MATCH: 6,          // only a tag overlap
  GOAL_PRIORITY_FACTOR: { high: 1.0, medium: 0.8, low: 0.6 },

  // --- timeFit -----------------------------------------------------------
  // Minutes a *meaningful* session on this topic needs, by mastery band.
  REQUIRED_MINUTES: [
    { maxMastery: 3, minutes: 90 }, // foundational: full learn + practice cycle
    { maxMastery: 6, minutes: 60 }, // developing
  ],
  REQUIRED_MINUTES_DEFAULT: 30,     // consolidating: a quick revision suffices
  TIMEFIT_FULL: 10,
  TIMEFIT_PARTIAL: 7,
  TIMEFIT_PARTIAL_RATIO: 0.66,
  TIMEFIT_MINIMAL: 4,
  TIMEFIT_MIN_USEFUL_MINUTES: 30,
  TIMEFIT_SQUEEZED: 1,

  // --- weak-area detection (dashboard panel, project document §7) --------
  WEAK_MASTERY_MAX: 4,
  WEAK_FAILURE_COUNT: 2,
  WEAK_LAST_SCORE_MAX: 50,

  // --- plan generation ---------------------------------------------------
  PLAN_SPLITS: [
    // Foundational: mostly learning. 90 min -> 45 / 30 / 15 (the document's example).
    { maxMastery: 3, learn: 0.5, practice: 0.33, review: 0.17 },
    // Developing: shift the weight to practice.
    { maxMastery: 6, learn: 0.33, practice: 0.5, review: 0.17 },
  ],
  PLAN_SPLIT_DEFAULT: { learn: 0.15, practice: 0.6, review: 0.25 },
  PLAN_ROUND_TO: 5,
  PLAN_MIN_MINUTES: 15,   // smallest plan we will ever hand back
  PLAN_MIN_BLOCK: 10,     // a block shorter than this is not worth listing
};

const idOf = (value) => {
  if (!value) return null;
  return String(value._id ? value._id : value);
};

const sameId = (a, b) => {
  const x = idOf(a);
  const y = idOf(b);
  return x !== null && y !== null && x === y;
};

const overlaps = (a = [], b = []) => {
  if (!a.length || !b.length) return false;
  const set = new Set(a.map((t) => String(t).toLowerCase()));
  return b.some((t) => set.has(String(t).toLowerCase()));
};

/* ------------------------------------------------------------------ *
 * 1. WEAKNESS  (0-10)
 * ------------------------------------------------------------------ */
export const weaknessScore = (topic) =>
  round(clamp(CONFIG.MAX_FACTOR - (topic.masteryScore ?? 5), 0, CONFIG.MAX_FACTOR), 2);

/* ------------------------------------------------------------------ *
 * 2. RECENT FAILURE  (0-10)
 *
 * Two visible components:
 *   A. Severity of the most recent attempt          (0-6)
 *   B. Repetition — CONSECUTIVE failures counting
 *      back from the latest, stopping at the first
 *      pass                                          (0-4)
 *
 * "Consecutive" rather than "failures in the last N" is the important choice:
 * one genuine pass resets the repetition penalty, which is exactly what makes
 * the adaptive loop visible — after the student improves, this factor drops
 * and a different topic can take the top slot.
 *
 * `topicAssessments` must be sorted newest-first.
 * ------------------------------------------------------------------ */
export const recentFailureScore = (topicAssessments = []) => {
  if (!topicAssessments.length) return 0;

  const latest = topicAssessments[0].percentage ?? 0;

  let severity = 0;
  if (latest < CONFIG.SHAKY_THRESHOLD) {
    severity = Math.round(
      (CONFIG.SEVERITY_MAX * (CONFIG.SHAKY_THRESHOLD - latest)) / CONFIG.SHAKY_THRESHOLD
    );
  }

  let consecutiveFailures = 0;
  for (const assessment of topicAssessments) {
    if ((assessment.percentage ?? 0) < CONFIG.FAIL_THRESHOLD) consecutiveFailures += 1;
    else break;
  }
  const repetition =
    CONFIG.REPETITION_PER_FAIL * Math.min(CONFIG.REPETITION_MAX_FAILS, consecutiveFailures);

  return clamp(severity + repetition, 0, CONFIG.MAX_FACTOR);
};

/* ------------------------------------------------------------------ *
 * 3. DEADLINE URGENCY  (0-10)
 *
 * Only deadlines *relevant to this topic* count, otherwise a DBMS assignment
 * due tomorrow would inflate every Data Structures topic. Relevance is:
 *   - the deadline names the topic's subject, or
 *   - the deadline names a goal whose subjects include the topic's subject, or
 *   - their tags overlap.
 * The most urgent relevant deadline wins.
 * ------------------------------------------------------------------ */
export const isDeadlineRelevant = (deadline, topic, goals = []) => {
  if (sameId(deadline.subjectId, topic.subjectId)) return true;

  if (deadline.goalId) {
    const goal = goals.find((g) => sameId(g._id, deadline.goalId));
    if (goal && (goal.subjects || []).some((s) => sameId(s, topic.subjectId))) return true;
  }

  return overlaps(deadline.tags, topic.tags);
};

export const urgencyFromDays = (days) => {
  for (const band of CONFIG.URGENCY_BANDS) {
    if (days <= band.maxDays) return band.score;
  }
  return CONFIG.URGENCY_FAR_AWAY;
};

export const deadlineUrgencyScore = (topic, deadlines = [], goals = []) => {
  const relevant = deadlines
    .filter((d) => d.status === 'upcoming' && d.dueDate)
    .filter((d) => isDeadlineRelevant(d, topic, goals));

  if (!relevant.length) return { score: CONFIG.URGENCY_NONE, deadline: null, days: null };

  let best = null;
  for (const deadline of relevant) {
    const days = daysUntil(deadline.dueDate);
    const score = urgencyFromDays(days);
    if (!best || score > best.score) best = { score, deadline, days };
  }
  return best;
};

/* ------------------------------------------------------------------ *
 * 4. GOAL RELEVANCE  (0-10)
 * Best match across the student's *active* goals, scaled by goal priority.
 * ------------------------------------------------------------------ */
export const goalRelevanceScore = (topic, goals = []) => {
  const active = goals.filter((g) => g.status === 'active');
  let best = { score: 0, goal: null, via: 'none' };

  for (const goal of active) {
    let base = 0;
    let via = 'none';

    if ((goal.subjects || []).some((s) => sameId(s, topic.subjectId))) {
      base = CONFIG.GOAL_SUBJECT_MATCH;
      via = 'subject';
    } else if (overlaps(goal.tags, topic.tags)) {
      base = CONFIG.GOAL_TAG_MATCH;
      via = 'tag';
    }

    if (base === 0) continue;

    const factor = CONFIG.GOAL_PRIORITY_FACTOR[goal.priority] ?? 0.8;
    const score = round(base * factor, 2);
    if (score > best.score) best = { score, goal, via };
  }

  return best;
};

/* ------------------------------------------------------------------ *
 * 5. TIME FIT  (0-10)
 *
 * Required time is derived from the topic's mastery band, which is what makes
 * this factor actually discriminate between topics. A flat "do I have time
 * today?" would score identically for every topic and contribute nothing to
 * the ranking. Because a weak topic needs a longer session, on a 30-minute day
 * a nearly-mastered topic legitimately wins — you cannot meaningfully start
 * graphs from scratch in 30 minutes.
 * ------------------------------------------------------------------ */
export const requiredMinutes = (topic) => {
  const mastery = topic.masteryScore ?? 5;
  for (const band of CONFIG.REQUIRED_MINUTES) {
    if (mastery <= band.maxMastery) return band.minutes;
  }
  return CONFIG.REQUIRED_MINUTES_DEFAULT;
};

export const timeFitScore = (topic, availableMinutes) => {
  const required = requiredMinutes(topic);
  if (availableMinutes >= required) return CONFIG.TIMEFIT_FULL;
  if (availableMinutes >= required * CONFIG.TIMEFIT_PARTIAL_RATIO) return CONFIG.TIMEFIT_PARTIAL;
  if (availableMinutes >= CONFIG.TIMEFIT_MIN_USEFUL_MINUTES) return CONFIG.TIMEFIT_MINIMAL;
  return CONFIG.TIMEFIT_SQUEEZED;
};

/* ------------------------------------------------------------------ *
 * WEAK AREA DETECTION (project document §7)
 * ------------------------------------------------------------------ */
export const isWeakTopic = (topic) =>
  (topic.masteryScore ?? 5) <= CONFIG.WEAK_MASTERY_MAX ||
  (topic.failureCount ?? 0) >= CONFIG.WEAK_FAILURE_COUNT ||
  (topic.lastAssessmentScore !== null &&
    topic.lastAssessmentScore !== undefined &&
    topic.lastAssessmentScore <= CONFIG.WEAK_LAST_SCORE_MAX);

/* ------------------------------------------------------------------ *
 * SCORE ONE TOPIC
 * ------------------------------------------------------------------ */
export const scoreTopic = ({ topic, goals = [], deadlines = [], topicAssessments = [], availableMinutes = 0 }) => {
  const weakness = weaknessScore(topic);
  const recentFailure = recentFailureScore(topicAssessments);
  const urgency = deadlineUrgencyScore(topic, deadlines, goals);
  const relevance = goalRelevanceScore(topic, goals);
  const timeFit = timeFitScore(topic, availableMinutes);

  const factors = {
    weakness,
    deadlineUrgency: urgency.score,
    goalRelevance: relevance.score,
    recentFailure,
    timeFit,
  };

  const priorityScore = round(
    factors.weakness + factors.deadlineUrgency + factors.goalRelevance +
    factors.recentFailure + factors.timeFit,
    2
  );

  return {
    topic,
    factors,
    priorityScore,
    // Kept for the reasoning sentence and the API response.
    evidence: {
      matchedDeadline: urgency.deadline,
      daysUntilDeadline: urgency.days,
      matchedGoal: relevance.goal,
      goalMatchedVia: relevance.via,
      recentAssessments: topicAssessments.slice(0, CONFIG.RECENT_WINDOW),
      requiredMinutes: requiredMinutes(topic),
      isWeak: isWeakTopic(topic),
    },
  };
};

/**
 * Ranks every topic. Scoring all of them (rather than pre-filtering to weak
 * ones) removes an entire edge case — "what if nothing is weak?" — at no cost,
 * because weak topics win on their own merits anyway.
 *
 * Tie-break is fully deterministic so the same state always produces the same
 * recommendation, which matters for a repeatable demo:
 *   score desc -> weakness desc -> least recently practised -> name A-Z
 */
export const rankTopics = ({ topics, goals, deadlines, scoreHistory, availableMinutes }) => {
  const scored = topics.map((topic) =>
    scoreTopic({
      topic,
      goals,
      deadlines,
      topicAssessments: scoreHistory.get(String(topic._id)) || [],
      availableMinutes,
    })
  );

  scored.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    if (b.factors.weakness !== a.factors.weakness) return b.factors.weakness - a.factors.weakness;
    const aTime = a.topic.lastPracticedAt ? new Date(a.topic.lastPracticedAt).getTime() : 0;
    const bTime = b.topic.lastPracticedAt ? new Date(b.topic.lastPracticedAt).getTime() : 0;
    if (aTime !== bTime) return aTime - bTime; // never/least recently practised first
    return String(a.topic.name).localeCompare(String(b.topic.name));
  });

  return scored;
};

/* ------------------------------------------------------------------ *
 * TIME-FITTED PLAN
 *
 * Derives the split from available time and mastery band. A foundational topic
 * with 90 minutes available produces 45 / 30 / 15 — the project document's
 * worked example, computed rather than hardcoded.
 * ------------------------------------------------------------------ */
export const planSplitFor = (topic) => {
  const mastery = topic.masteryScore ?? 5;
  for (const split of CONFIG.PLAN_SPLITS) {
    if (mastery <= split.maxMastery) return split;
  }
  return CONFIG.PLAN_SPLIT_DEFAULT;
};

const roundTo = (n, step) => Math.round(n / step) * step;

export const buildPlan = (topic, availableMinutes) => {
  const budget = Math.max(
    CONFIG.PLAN_MIN_MINUTES,
    roundTo(Math.min(availableMinutes, requiredMinutes(topic)), CONFIG.PLAN_ROUND_TO)
  );
  const split = planSplitFor(topic);
  const name = topic.name;
  const isWeak = (topic.masteryScore ?? 5) <= 6;

  const learn = roundTo(budget * split.learn, CONFIG.PLAN_ROUND_TO);
  const review = roundTo(budget * split.review, CONFIG.PLAN_ROUND_TO);
  // The practice block absorbs the rounding remainder, so the blocks always
  // sum to exactly `budget` and the student is never handed an overrunning plan.
  const practice = budget - learn - review;

  const blocks = [
    { label: isWeak ? `Review ${name} fundamentals` : `Refresh key ${name} patterns`, minutes: learn },
    { label: `Solve targeted ${name} problems`, minutes: practice },
    { label: 'Review mistakes and record the concepts that caused errors', minutes: review },
  ];

  /**
   * A small budget must not turn into three token blocks (5 / 5 / 5 is not a
   * study plan). Blocks below PLAN_MIN_BLOCK are dropped and their minutes
   * handed to the largest surviving block, so a squeezed day yields one
   * focused session instead of three fragments.
   */
  const kept = blocks.filter((b) => b.minutes >= CONFIG.PLAN_MIN_BLOCK);

  if (!kept.length) {
    return {
      plan: [{ label: `Focused review of ${name}`, minutes: budget }],
      totalMinutes: budget,
    };
  }

  const droppedMinutes = blocks
    .filter((b) => b.minutes < CONFIG.PLAN_MIN_BLOCK)
    .reduce((sum, b) => sum + b.minutes, 0);

  if (droppedMinutes > 0) {
    const largest = kept.reduce((a, b) => (b.minutes > a.minutes ? b : a));
    largest.minutes += droppedMinutes;
  }

  return { plan: kept, totalMinutes: kept.reduce((sum, b) => sum + b.minutes, 0) };
};

export default {
  CONFIG,
  weaknessScore,
  recentFailureScore,
  deadlineUrgencyScore,
  goalRelevanceScore,
  timeFitScore,
  requiredMinutes,
  isWeakTopic,
  scoreTopic,
  rankTopics,
  buildPlan,
};
