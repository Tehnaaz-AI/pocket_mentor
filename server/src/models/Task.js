import mongoose from 'mongoose';

/**
 * The concrete action a recommendation resolves to, and the real backing store
 * for the existing RevisionTodoList component — which previously kept its
 * items in browser localStorage only, so they never reached the server and
 * could not inform anything.
 */
const taskSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    goalId: { type: String, ref: 'Goal', default: null },
    subjectId: { type: String, ref: 'Subject', default: null },
    topicId: { type: String, ref: 'Topic', default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    estimatedMinutes: { type: Number, default: 30, min: 1 },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['pending', 'in-progress', 'completed', 'skipped'], default: 'pending' },
    dueDate: { type: String, default: null },
    completedAt: { type: String, default: null },
    // Distinguishes "I wrote this down" from "the engine proposed this".
    source: { type: String, enum: ['manual', 'recommendation'], default: 'manual' },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false }
);

taskSchema.index({ userId: 1, status: 1, dueDate: 1 });

export default mongoose.model('Task', taskSchema);
