import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import { ID } from '../utils/ids.js';
import { normalizeKey, titleCase } from '../utils/text.js';

/**
 * THE BRIDGE BETWEEN THE TWO HALVES OF POCKET MENTOR.
 *
 * The original app deals in free-text strings: note.subject is "Computer
 * Science", and the AI extracts per-question concepts like "Mutual Exclusion".
 * The academic layer needs stable Subject and Topic documents to rank.
 *
 * These resolvers turn one into the other. Their effect on the product is that
 * a student's topic catalogue GROWS OUT OF THEIR OWN NOTES — importing notes
 * and taking a quiz is all it takes for the priority engine to have something
 * to reason about. No separate onboarding wizard, and nothing about the
 * original "messy notes in, revision tools out" flow changes.
 *
 * Deliberately deterministic: normalise, match, otherwise create. No AI is
 * involved in deciding identity.
 */

// A safety valve: one quiz should never be able to invent dozens of topics.
const MAX_AUTO_TOPICS_PER_CALL = 12;

/** Find-or-create the Subject for a free-text subject label. */
export async function resolveSubject(userId, subjectName) {
  const name = titleCase(subjectName) || 'General';
  const nameKey = normalizeKey(name) || 'general';

  const existing = await Subject.findOne({ userId, nameKey });
  if (existing) return existing;

  try {
    return await Subject.create({ _id: ID.subject(), userId, name, nameKey });
  } catch (err) {
    // Unique index race: another request created it first.
    if (err.code === 11000) return Subject.findOne({ userId, nameKey });
    throw err;
  }
}

/**
 * Find-or-create the Topic for an AI-extracted concept string.
 * Matches on the normalised name first, then on any recorded alias.
 */
export async function resolveTopic(userId, conceptName, subjectId) {
  const name = titleCase(conceptName);
  if (!name) return null;
  const nameKey = normalizeKey(name);
  if (!nameKey) return null;

  let topic = await Topic.findOne({ userId, $or: [{ nameKey }, { aliases: nameKey }] });
  if (topic) {
    // Remember the spelling variant so it matches directly next time.
    if (topic.nameKey !== nameKey && !topic.aliases.includes(nameKey)) {
      topic.aliases.push(nameKey);
      await topic.save();
    }
    return topic;
  }

  try {
    topic = await Topic.create({
      _id: ID.topic(),
      userId,
      subjectId,
      name,
      nameKey,
      source: 'extracted',
      // Neutral, not zero: an unseen topic is unknown, not failing.
      masteryScore: 5,
    });
    return topic;
  } catch (err) {
    if (err.code === 11000) return Topic.findOne({ userId, nameKey });
    throw err;
  }
}

/**
 * Resolve a batch of concept strings to Topic documents under one subject.
 * Returns a Map keyed by the ORIGINAL string so callers can look results up
 * by whatever the AI gave them.
 */
export async function resolveTopics(userId, conceptNames = [], subjectId) {
  const map = new Map();
  const unique = [...new Set(conceptNames.filter(Boolean).map(String))];

  for (const concept of unique.slice(0, MAX_AUTO_TOPICS_PER_CALL)) {
    const topic = await resolveTopic(userId, concept, subjectId);
    if (topic) map.set(concept, topic);
  }
  return map;
}

export default { resolveSubject, resolveTopic, resolveTopics };
