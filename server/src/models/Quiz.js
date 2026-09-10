import mongoose from 'mongoose';

/**
 * THE SOURCE OF TRUTH FOR QUIZ RESULTS.
 *
 * Already the richest record in the app: the questions, the submitted answers,
 * per-question grading and the per-concept diagnostics. The donor backend's
 * Assessment model does NOT duplicate this — Assessment is now restricted to
 * scores earned outside the app (see Assessment.js).
 *
 * The engine's `recentFailure` factor is DERIVED from gradedQuestions here
 * rather than copied into a second collection.
 */
const quizSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    sessionId: { type: String, ref: 'StudyKit', index: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    topic: { type: String, default: 'General' }, // the kit's subject label
    questions: { type: mongoose.Schema.Types.Mixed, default: [] },
    score: { type: Number, default: null },
    total: { type: Number, default: null },
    accuracy: { type: Number, default: null },
    attempted: { type: Boolean, default: false },
    weakConcepts: { type: [String], default: [] },
    submittedAnswers: { type: mongoose.Schema.Types.Mixed, default: null },
    gradedQuestions: { type: mongoose.Schema.Types.Mixed, default: [] },
    attemptedAt: { type: String, default: null },
    isRevision: { type: Boolean, default: false },
    weakConceptsTargeted: { type: [String], default: [] },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false }
);

// Serves the derived progress view and the engine's per-topic score history.
quizSchema.index({ userId: 1, attempted: 1, attemptedAt: -1 });

export default mongoose.model('Quiz', quizSchema);
