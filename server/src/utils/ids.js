import { v4 as uuidv4 } from 'uuid';

/**
 * PocketMentor 1.0 used prefixed string ids ("usr_<uuid>", "note_<uuid>").
 * The merge keeps that scheme rather than switching to ObjectIds, so migrated
 * documents keep their identity and already-issued JWTs keep working.
 */
export const newId = (prefix) => `${prefix}_${uuidv4()}`;

export const ID = {
  user: () => newId('usr'),
  note: () => newId('note'),
  kit: () => newId('ses'),          // 'ses' preserved: existing kit ids use it
  flashcard: () => newId('fc'),
  quiz: () => newId('qz'),
  revisionQuiz: () => newId('rev_qz'),
  subject: () => newId('sub'),
  topic: () => newId('top'),
  goal: () => newId('goal'),
  deadline: () => newId('dl'),
  task: () => newId('task'),
  studyLog: () => newId('log'),
  assessment: () => newId('asmt'),
  recommendation: () => newId('rec'),
};

/** Any non-empty string is a valid id here — ids are not ObjectIds. */
export const isValidId = (value) => typeof value === 'string' && value.trim().length > 0;

export default ID;
