import mongoose from 'mongoose';

/**
 * A student's imported notes — the entry point of the original problem
 * statement. Shape is unchanged from 1.0; two fields are added so the
 * Academic State can find notes for a given topic.
 */
const noteSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    title: { type: String, required: true },
    subject: { type: String, default: 'General' }, // free text, kept for display
    sourceType: { type: String, default: 'paste' },
    fileName: { type: String },
    extractedText: { type: String, required: true },
    wordCount: { type: Number, default: 0 },

    // --- merge additions ---
    // Resolved from the free-text `subject` above, so the engine can group notes.
    subjectId: { type: String, ref: 'Subject', default: null },
    // Populated once a study kit reveals which topics this note actually covers.
    // This is what lets "study Dynamic Programming" find source material.
    topicIds: [{ type: String, ref: 'Topic' }],

    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false }
);

noteSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Note', noteSchema);
