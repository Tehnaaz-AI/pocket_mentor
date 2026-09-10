import mongoose from 'mongoose';

/**
 * THE SOURCE OF TRUTH FOR TOPIC MASTERY.
 *
 * Before the merge, mastery lived in progress.topics{}, keyed by the concept
 * strings the AI extracted from notes ('Mutual Exclusion', 'Hold and Wait'),
 * with mastery stored as a label computed from correct/attempts. That store is
 * gone: GET /api/progress now DERIVES the identical response from these
 * documents, so the existing Progress and Dashboard screens are unchanged.
 *
 * Two statistics are kept, and they are not duplicates of each other:
 *   - attempts / correct  are raw event counters (facts)
 *   - masteryScore        is a recency-weighted EMA (the single stored opinion)
 * The engine needs recency; the original UI label needs the cumulative ratio.
 * Both come from one owner.
 */
const topicSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    subjectId: { type: String, required: true, ref: 'Subject', index: true },
    name: { type: String, required: true, trim: true },
    // Normalised name plus any spelling variants seen in AI output, so
    // "Mutual Exclusion" and "mutual exclusion" resolve to one topic.
    nameKey: { type: String, required: true },
    aliases: { type: [String], default: [] },

    /**
     * Defaults to 5, deliberately — NOT 0. A brand new topic is *unknown*, not
     * *failing*. At 0 every newly extracted concept would score weakness 10 and
     * out-rank a topic the student genuinely struggles with.
     */
    masteryScore: { type: Number, default: 5, min: 0, max: 10 },

    // Raw counters, carried over from progress.topics{}.
    attempts: { type: Number, default: 0, min: 0 },
    correct: { type: Number, default: 0, min: 0 },

    practiceCount: { type: Number, default: 0, min: 0 },
    failureCount: { type: Number, default: 0, min: 0 },
    lastPracticedAt: { type: String, default: null },
    lastAssessmentScore: { type: Number, default: null, min: 0, max: 100 },

    tags: { type: [String], default: [] },
    // 'extracted' = auto-created from a quiz concept; 'manual' = student added.
    source: { type: String, enum: ['extracted', 'manual'], default: 'extracted' },

    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false }
);

topicSchema.index({ userId: 1, nameKey: 1 }, { unique: true });
topicSchema.index({ userId: 1, masteryScore: 1 }); // weak-topic scan

/**
 * The mastery LABEL the original UI displays, derived rather than stored.
 * Mirrors 1.0's thresholds (ratio >= 0.8 with at least 2 attempts => Mastered,
 * >= 0.5 => Improving) but expressed against the owned masteryScore so there is
 * only one place mastery is decided.
 */
topicSchema.methods.masteryLabel = function masteryLabel() {
  if (this.masteryScore >= 8 && this.attempts >= 2) return 'Mastered';
  if (this.masteryScore >= 5) return 'Improving';
  return 'Needs Review';
};

export default mongoose.model('Topic', topicSchema);
