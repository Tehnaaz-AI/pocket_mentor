import mongoose from 'mongoose';

/**
 * The generated revision kit: summary, 60-second summary, key concepts,
 * memory hooks and a quiz reference. This is PocketMentor 1.0's central
 * artifact and the thing the Study Workspace renders.
 *
 * NAMING: in store.json this collection was called `studySessions`. It is
 * renamed StudyKit here because it describes a *kit*, not a period of study
 * time — the donor backend brought its own StudySession model meaning
 * "minutes planned vs actually studied", which now lives in StudyLog.js.
 * The stored field names are untouched, so the client sees no difference.
 */
const studyKitSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    noteId: { type: String, ref: 'Note' },
    title: { type: String, required: true },
    subject: { type: String, default: 'General' },
    difficulty: { type: String, default: 'Medium' },
    summary: { type: String, default: '' },
    sixtySecondSummary: { type: mongoose.Schema.Types.Mixed, default: null },
    keyConcepts: { type: [String], default: [] },
    memoryHooks: { type: mongoose.Schema.Types.Mixed, default: [] },
    quizId: { type: String, ref: 'Quiz' },
    status: { type: String, default: 'ready' },

    // --- merge additions ---
    subjectId: { type: String, ref: 'Subject', default: null },
    topicIds: [{ type: String, ref: 'Topic' }],
    // Set when the kit was launched from a Next Best Action rather than manually.
    recommendationId: { type: String, ref: 'Recommendation', default: null },

    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false, collection: 'studykits' }
);

studyKitSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('StudyKit', studyKitSchema);
