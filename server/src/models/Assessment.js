import mongoose from 'mongoose';

/**
 * Scores earned OUTSIDE the app — a college internal, a written assignment, a
 * mock test taken on paper.
 *
 * Deliberately narrowed during the merge. In-app quiz results belong to Quiz,
 * which already stores far more detail. Writing an in-app quiz here as well
 * would create a second source of truth for the same event, so the quiz submit
 * path never touches this collection.
 */
const assessmentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    subjectId: { type: String, ref: 'Subject', default: null },
    topicId: { type: String, required: true, ref: 'Topic', index: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['test', 'assignment', 'practice', 'external'], default: 'test' },
    score: { type: Number, required: true, min: 0 },
    totalMarks: { type: Number, required: true },
    percentage: { type: Number, min: 0, max: 100 }, // computed, never client-supplied
    date: { type: String, default: () => new Date().toISOString() },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false }
);

// score <= totalMarks is a cross-field rule, so it lives in a hook.
// Mongoose 9 middleware signals failure by throwing, not via next(err).
assessmentSchema.pre('validate', function computePercentage() {
  if (typeof this.totalMarks === 'number' && typeof this.score === 'number') {
    if (this.totalMarks <= 0) throw new Error('totalMarks must be greater than 0');
    if (this.score > this.totalMarks) {
      throw new Error(`Score (${this.score}) cannot exceed totalMarks (${this.totalMarks})`);
    }
    this.percentage = Math.round((this.score / this.totalMarks) * 10000) / 100;
  }
});

assessmentSchema.index({ userId: 1, topicId: 1, date: -1 });

export default mongoose.model('Assessment', assessmentSchema);
