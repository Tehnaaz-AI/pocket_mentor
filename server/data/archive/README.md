# Archive — inert, not used at runtime

Nothing in this folder is read by the application. It exists for provenance and
rollback only. Pocket Mentor runs on MongoDB exclusively.

## Legacy JSON persistence

| File | What it is |
| :--- | :--- |
| `store.legacy-json-datastore.json` | The flat-file database PocketMentor 1.0 used before the Academic OS merge. It was `server/data/store.json` and was read and rewritten on every request. Moved here so it can never become the active datastore again. |
| `store.pre-merge.json` | Byte-identical snapshot of the same file, taken before the merge began. |

## Pre-merge API snapshots

Captured from the running 1.0 server before any code changed, and used as the
regression oracle while moving persistence to MongoDB.

| File | Endpoint |
| :--- | :--- |
| `baseline.progress.json` | `GET /api/progress` |
| `baseline.dashboard.json` | `GET /api/dashboard` |
| `baseline.notes.json` | `GET /api/notes` |
| `baseline.studykit.json` | `GET /api/study/:sessionId` |

## legacy-migration/

`migrateStore.js` imported the JSON store into MongoDB. That migration is done
and is **deliberately no longer runnable**: it has been moved out of
`server/src/`, and its `npm run migrate` scripts were removed, so it cannot
accidentally repopulate a clean database. Its relative imports
(`../config/db.js`, `../models/*`) no longer resolve from this location — by
design. It is kept as documentation of how the migration worked.

To empty the database instead, use the supported tool:

```bash
npm run verify:db          # report counts
npm run clean:db           # dry run
npm run clean:db:confirm   # delete
```
