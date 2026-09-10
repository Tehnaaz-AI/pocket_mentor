import mongoose from 'mongoose';

/**
 * Time actually spent studying — planned vs actual minutes.
 *
 * This is the donor backend's `StudySession` model, RENAMED. PocketMentor 1.0
 * already had a `studySessions` collection meaning something completely
 * different (a generated study kit, now StudyKit.js). Two models cannot share
 * that name, and the rename lands on this one because it has no live data and
 * nothing in the client depends on it.
 *
 * Its only job in the engine is to answer "how many of today's minutes are
 * already committed?", which feeds the timeFit factor.
 */
const studyLogSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User', index: true },
    taskId: { type: String, ref: 'Task', default: null },
    topicId: { type: String, ref: 'Topic', default: null },
    kitId: { type: String, ref: 'StudyKit', default: null },
    plannedMinutes: { type: Number, required: true, min: 1 },
    actualMinutes: { type: Number, default: 0, min: 0 },
    startTime: { type: String, default: () => new Date().toISOString() },
    endTime: { type: String, default: null },
    status: { type: String, enum: ['planned', 'completed', 'missed'], default: 'planned' },
    outcome: { type: String, enum: ['productive', 'partial', 'struggled', null], default: null },
    notes: { type: String, default: '' },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false }
);

studyLogSchema.index({ userId: 1, startTime: -1 });

export default mongoose.model('StudyLog', studyLogSchema);
