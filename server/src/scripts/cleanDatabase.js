/**
 * DATABASE CLEANUP — removes all Pocket Mentor application documents.
 *
 * A development utility for returning MongoDB to an empty state. It deletes
 * documents, never the database or the collections themselves, so indexes and
 * configuration survive and the app keeps working untouched.
 *
 * It creates nothing. There is deliberately no seed path here: the app is
 * meant to build its own state from real usage — notes in, study kit out,
 * quiz taken, topics created, mastery updated, recommendation generated.
 *
 *   node src/scripts/cleanDatabase.js              dry run (default, safe)
 *   node src/scripts/cleanDatabase.js --confirm    actually delete
 *   node src/scripts/cleanDatabase.js --verify     just report counts
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

import User from '../models/User.js';
import Note from '../models/Note.js';
import StudyKit from '../models/StudyKit.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Goal from '../models/Goal.js';
import Deadline from '../models/Deadline.js';
import Assessment from '../models/Assessment.js';
import Task from '../models/Task.js';
import StudyLog from '../models/StudyLog.js';
import Recommendation from '../models/Recommendation.js';

/**
 * Ordered children -> parents. There are no cascade hooks on any schema, so
 * every collection has to be cleared explicitly; deleting only users would
 * leave every other document orphaned but still stored.
 */
const MODELS = [
  ['recommendations', Recommendation],
  ['studylogs', StudyLog],
  ['tasks', Task],
  ['assessments', Assessment],
  ['deadlines', Deadline],
  ['goals', Goal],
  ['flashcards', Flashcard],
  ['quizzes', Quiz],
  ['studykits', StudyKit],
  ['notes', Note],
  ['topics', Topic],
  ['subjects', Subject],
  ['users', User],
];

const run = async () => {
  const confirmed = process.argv.includes('--confirm');
  const verifyOnly = process.argv.includes('--verify');
  await connectDB();

  const before = [];
  for (const [name, Model] of MODELS) before.push([name, await Model.countDocuments()]);
  const total = before.reduce((s, [, n]) => s + n, 0);

  if (verifyOnly) {
    console.log('\nCurrent document counts\n');
    for (const [name, n] of before) console.log(`  ${name.padEnd(18)} ${String(n).padStart(5)}`);
    console.log(`  ${'TOTAL'.padEnd(18)} ${String(total).padStart(5)}`);
    console.log(total === 0 ? '\n✅ Database is clean.\n' : '');
    await mongoose.connection.close();
    return;
  }

  console.log(`\n${confirmed ? 'DELETING' : 'DRY RUN — nothing will be deleted'}\n`);
  console.log('  collection            docs');
  console.log('  ' + '-'.repeat(28));

  let deleted = 0;
  for (const [name, Model] of MODELS) {
    const count = before.find(([n]) => n === name)[1];
    if (confirmed && count > 0) {
      const res = await Model.deleteMany({});
      deleted += res.deletedCount;
      console.log(`  ${name.padEnd(18)} ${String(res.deletedCount).padStart(5)}  deleted`);
    } else {
      console.log(`  ${name.padEnd(18)} ${String(count).padStart(5)}  ${count ? (confirmed ? '' : 'would delete') : '(already empty)'}`);
    }
  }

  if (!confirmed) {
    console.log(`\n  ${total} document(s) would be removed.`);
    console.log('  Re-run with --confirm to apply.\n');
    await mongoose.connection.close();
    return;
  }

  // Verify from the database rather than trusting the delete counts.
  console.log('\nVerification\n');
  let remaining = 0;
  for (const [name, Model] of MODELS) {
    const n = await Model.countDocuments();
    remaining += n;
    console.log(`  ${name.padEnd(18)} ${String(n).padStart(5)}  ${n === 0 ? 'OK' : 'STILL POPULATED'}`);
  }

  console.log(`\n  deleted ${deleted} document(s); ${remaining} remaining.`);
  console.log(remaining === 0
    ? '\n✅ Database is clean. No data was seeded — the app will build its own\n   state from real usage.\n'
    : '\n⚠️  Some documents remain.\n');

  await mongoose.connection.close();
};

run().catch(async (err) => {
  console.error('Cleanup failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
