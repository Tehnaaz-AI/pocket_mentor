import mongoose from 'mongoose';

/**
 * The persisted, explainable Next Best Action.
 *
 * `factors` is stored as a snapshot on purpose. The score is always recomputed
 * live, but once the academic state moves on there is no way to reconstruct why
 * yesterday's recommendation said what it said — and "Why this recommendation?"
 * needs to keep answering truthfully. A bare score of 40 explains nothing.
 */
const factorsSchema = new mongoose.Schema(
  {
    weakness: { type: Number, default: 0 },
    deadlineUrgency: { type: Number, default: 0 },
    goalRelevance: { type: Number, default: 0 },
    recentFailure: { type: Number, default: 0 },
    timeFit: { type: Number, default: 0 },
  },
  { _id: false }
);

const planItemSchema = new mongoose.Schema(
  { label: { type: String, required: true }, minutes: { type: Number, required: true, min: 1 } },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    topicId: { type: String, ref: 'Topic', default: null },
    subjectId: { type: String, ref: 'Subject', default: null },
    goalId: { type: String, ref: 'Goal', default: null },
    taskId: { type: String, ref: 'Task', default: null },

    topicName: { type: String, default: '' },   // denormalised for display
    subjectName: { type: String, default: '' },

    title: { type: String, required: true },
    description: { type: String, default: '' },

    priorityScore: { type: Number, default: 0, min: 0, max: 50 },
    factors: { type: factorsSchema, default: () => ({}) },
    reasoning: { type: String, default: '' },

    plan: { type: [planItemSchema], default: [] },
    estimatedMinutes: { type: Number, default: 0 },
    availableMinutes: { type: Number, default: 0 },

    /**
     * How the student can act on this right now:
     *   'study'  - notes exist for the topic, a kit can be generated
     *   'import' - no notes yet, route to the importer instead of inventing content
     */
    actionType: { type: String, enum: ['study', 'import'], default: 'study' },
    sourceNoteId: { type: String, ref: 'Note', default: null },
    // Set once Start Session has generated a kit, so the workspace can reopen.
    kitId: { type: String, ref: 'StudyKit', default: null },

    status: { type: String, enum: ['pending', 'started', 'completed', 'skipped'], default: 'pending' },
    generatedAt: { type: String, default: () => new Date().toISOString() },
    startedAt: { type: String, default: null },
    completedAt: { type: String, default: null },
  },
  { versionKey: false }
);

recommendationSchema.index({ userId: 1, status: 1, generatedAt: -1 });

export default mongoose.model('Recommendation', recommendationSchema);
