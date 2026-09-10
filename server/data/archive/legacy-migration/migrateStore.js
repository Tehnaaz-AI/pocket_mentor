/**
 * MIGRATION — server/data/store.json  ->  MongoDB
 *
 * One-time (but idempotent, so safe to re-run) import of the flat-file store
 * into the merged MongoDB schema.
 *
 * The delicate part is `progress`. That document is NOT migrated as-is,
 * because it no longer exists as a stored entity: its `topics{}` map becomes
 * Subject + Topic documents, and GET /api/progress derives the original
 * payload back out of them.
 *
 * Topic mastery is seeded as (correct / attempts) * 10, which reproduces
 * 1.0's mastery labels exactly:
 *     0/2 -> 0.0 -> "Needs Review"      1/2 -> 5.0 -> "Improving"
 * so nothing a student already saw changes.
 *
 *   node src/scripts/migrateStore.js            migrate
 *   node src/scripts/migrateStore.js --verify    report only, write nothing
 */
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/db.js';

import User from '../models/User.js';
import Note from '../models/Note.js';
import StudyKit from '../models/StudyKit.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import { ID } from '../utils/ids.js';
import { normalizeKey } from '../utils/text.js';
import { clamp, round } from '../utils/text.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE = path.join(__dirname, '../../data/store.json');

const upsert = async (Model, doc) => {
  await Model.updateOne({ _id: doc._id }, { $setOnInsert: doc }, { upsert: true });
};

const run = async () => {
  const verifyOnly = process.argv.includes('--verify');
  await connectDB();

  if (!fs.existsSync(STORE)) {
    console.log('No store.json found — nothing to migrate.');
    await mongoose.connection.close();
    return;
  }

  const store = JSON.parse(fs.readFileSync(STORE, 'utf-8'));
  const counts = { users: 0, notes: 0, kits: 0, flashcards: 0, quizzes: 0, subjects: 0, topics: 0 };

  if (verifyOnly) {
    console.log('\n--- MongoDB contents ---');
    for (const [name, Model] of Object.entries({ User, Note, StudyKit, Flashcard, Quiz, Subject, Topic })) {
      console.log(`  ${name.padEnd(11)} ${await Model.countDocuments()}`);
    }
    await mongoose.connection.close();
    return;
  }

  /* ---------------- users: passwordHash carried across verbatim ----------------
   * bcryptjs 2.x and 3.x both produce standard $2a/$2b bcrypt hashes, so
   * existing passwords keep working without a reset. */
  for (const u of store.users || []) {
    await upsert(User, {
      _id: u._id,
      name: u.name,
      email: String(u.email).toLowerCase(),
      passwordHash: u.passwordHash,
      streak: u.streak ?? 1,
      dailyStudyMinutes: 90, // sensible default so timeFit has something to work with
      createdAt: u.createdAt,
    });
    counts.users += 1;
  }

  /* ---------------- subjects: resolved from each note's free-text label ---------------- */
  const subjectIdByKey = new Map();
  const resolveSubjectId = async (userId, label) => {
    const name = String(label || 'General').trim();
    const nameKey = normalizeKey(name) || 'general';
    const cacheKey = `${userId}::${nameKey}`;
    if (subjectIdByKey.has(cacheKey)) return subjectIdByKey.get(cacheKey);

    let subject = await Subject.findOne({ userId, nameKey });
    if (!subject) {
      subject = await Subject.create({ _id: ID.subject(), userId, name, nameKey });
      counts.subjects += 1;
    }
    subjectIdByKey.set(cacheKey, subject._id);
    return subject._id;
  };

  for (const n of store.notes || []) {
    const subjectId = await resolveSubjectId(n.userId, n.subject);
    await upsert(Note, { ...n, subjectId, topicIds: [] });
    counts.notes += 1;
  }

  for (const s of store.studySessions || []) {
    const subjectId = await resolveSubjectId(s.userId, s.subject);
    await upsert(StudyKit, { ...s, subjectId, topicIds: [], recommendationId: null });
    counts.kits += 1;
  }

  for (const f of store.flashcards || []) { await upsert(Flashcard, f); counts.flashcards += 1; }
  for (const q of store.quizzes || []) { await upsert(Quiz, q); counts.quizzes += 1; }

  /* ---------------- progress.topics{} -> Topic documents ----------------
   * Iterated in original insertion order so createdAt preserves it, which is
   * what makes the derived weakTopics ordering (and dashboard.nextRevisionDue)
   * match the pre-merge response. */
  for (const prog of store.progress || []) {
    const userId = prog.userId;
    const userNotes = (store.notes || []).filter((n) => n.userId === userId);
    const defaultSubjectLabel = userNotes[0]?.subject || 'General';
    const subjectId = await resolveSubjectId(userId, defaultSubjectLabel);

    let order = 0;
    for (const [name, t] of Object.entries(prog.topics || {})) {
      const nameKey = normalizeKey(name);
      if (!nameKey) continue;

      const attempts = t.attempts ?? 0;
      const correct = t.correct ?? 0;
      const ratio = attempts > 0 ? correct / attempts : 0.5; // no evidence -> neutral
      const masteryScore = clamp(round(ratio * 10, 1), 0, 10);

      const existing = await Topic.findOne({ userId, nameKey });
      if (existing) continue;

      await Topic.create({
        _id: ID.topic(),
        userId,
        subjectId,
        name,
        nameKey,
        masteryScore,
        attempts,
        correct,
        practiceCount: attempts > 0 ? 1 : 0,
        failureCount: ratio < 0.5 ? 1 : 0,
        lastPracticedAt: t.lastStudied ?? null,
        lastAssessmentScore: attempts > 0 ? Math.round(ratio * 100) : null,
        source: 'extracted',
        // sequential so createdAt sorting reproduces the original key order
        createdAt: new Date(Date.parse(prog.lastActiveDate || Date.now()) + order).toISOString(),
      });
      counts.topics += 1;
      order += 1;
    }
  }

  /* ---------------- backfill cached subject progress ---------------- */
  const { recomputeSubjectProgress } = await import('../services/performanceService.js');
  for (const subject of await Subject.find()) {
    await recomputeSubjectProgress(subject._id, subject.userId);
  }

  console.log('\n✅ Migration complete');
  for (const [k, v] of Object.entries(counts)) console.log(`   ${k.padEnd(12)} ${v}`);
  console.log('\n   store.json left untouched; a pre-merge copy is in data/archive/.');

  await mongoose.connection.close();
};

run().catch(async (err) => {
  console.error('Migration failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
