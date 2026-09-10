import mongoose from 'mongoose';

/** Active-recall card belonging to a study kit. Shape unchanged from 1.0. */
const flashcardSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    sessionId: { type: String, required: true, ref: 'StudyKit', index: true },
    userId: { type: String, required: true, ref: 'User' },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    concept: { type: String, default: 'Key Point' },
    difficulty: { type: String, default: 'Medium' },
    mastery: { type: String, default: 'unreviewed' }, // unreviewed | Easy | Medium | Hard
    lastReviewedAt: { type: String, default: null },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false }
);

export default mongoose.model('Flashcard', flashcardSchema);
