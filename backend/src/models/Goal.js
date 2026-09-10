import mongoose from 'mongoose';

/**
 * Supplies the goalRelevance priority factor. No 1.0 equivalent existed.
 *
 * `subjects` and `tags` are what make relevance computable at all: the
 * project document requires goal-aware prioritisation but never says how a
 * topic is linked to a goal. Two explicit links — a hard subject link
 * (relevance 10) and a soft tag overlap (6).
 */
export const GOAL_TYPES = ['placement', 'semester-exam', 'gpa-improvement', 'project', 'certification', 'other'];

const goalSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: GOAL_TYPES, default: 'other' },
    description: { type: String, default: '' },
    targetDate: { type: String, default: null },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
    subjects: [{ type: String, ref: 'Subject' }],
    tags: { type: [String], default: [] },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false }
);

goalSchema.index({ userId: 1, status: 1 });

export default mongoose.model('Goal', goalSchema);
