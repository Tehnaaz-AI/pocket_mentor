import mongoose from 'mongoose';

/**
 * Promoted from 1.0's free-text `note.subject` string into a real entity.
 * The string is still stored on Note/StudyKit for display; this document is
 * what the engine groups topics under. Resolved find-or-create by name, so
 * importing notes labelled "Computer Science" builds the catalogue by itself.
 */
const subjectSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    name: { type: String, required: true, trim: true },
    // Normalised for matching: lowercased, whitespace collapsed.
    nameKey: { type: String, required: true },
    description: { type: String, default: '' },
    /**
     * Derived-but-cached: mean topic mastery x 10, recomputed whenever a topic
     * in this subject changes. Caching on write keeps dashboard reads a plain
     * find() instead of an aggregation.
     */
    progress: { type: Number, default: 0, min: 0, max: 100 },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false }
);

subjectSchema.index({ userId: 1, nameKey: 1 }, { unique: true });

export default mongoose.model('Subject', subjectSchema);
