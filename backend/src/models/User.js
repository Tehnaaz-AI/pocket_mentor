import mongoose from 'mongoose';

/**
 * Merged User: PocketMentor 1.0's original fields plus the academic profile
 * the Next Best Action engine needs.
 *
 * `passwordHash` keeps its original name deliberately — the live accounts in
 * store.json use it, and routes/auth.js already compares against it. Renaming
 * it would buy nothing and risk locking existing students out.
 *
 * String _id (e.g. "usr_<uuid>") preserves 1.0's ID scheme, so migrated data
 * and already-issued JWTs keep working.
 */
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    streak: { type: Number, default: 1, min: 0 },

    // --- academic profile (merged in from the donor backend) ---
    college: { type: String, trim: true, default: '' },
    course: { type: String, trim: true, default: '' },
    year: { type: Number, min: 1, max: 5, default: null },
    // Drives the timeFit priority factor.
    dailyStudyMinutes: { type: Number, default: 90, min: 15, max: 960 },
    preferredStudyStart: { type: String, default: '18:00', match: TIME_REGEX },
    preferredStudyEnd: { type: String, default: '21:00', match: TIME_REGEX },

    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false, timestamps: false }
);

export default mongoose.model('User', userSchema);
