import mongoose from 'mongoose';

/**
 * Supplies the deadlineUrgency factor. No 1.0 equivalent existed.
 *
 * The subject/goal/tag links are essential, not optional: urgency has to be
 * topic-relevant, or a DBMS assignment due tomorrow would inflate the priority
 * of every Data Structures topic.
 */
const deadlineSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['exam', 'assignment', 'project', 'submission', 'other'], default: 'other' },
    description: { type: String, default: '' },
    dueDate: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['upcoming', 'completed', 'missed'], default: 'upcoming' },
    subjectId: { type: String, ref: 'Subject', default: null },
    goalId: { type: String, ref: 'Goal', default: null },
    tags: { type: [String], default: [] },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false }
);

deadlineSchema.index({ userId: 1, status: 1, dueDate: 1 });

export default mongoose.model('Deadline', deadlineSchema);
