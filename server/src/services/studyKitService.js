import { aiService } from './aiService.js';
import { dbStore } from './dbStore.js';
import { resolveSubject } from './topicResolver.js';
import Note from '../models/Note.js';
import { ID } from '../utils/ids.js';

/**
 * THE ONE AND ONLY STUDY-KIT GENERATOR.
 *
 * This is PocketMentor 1.0's kit-building logic, lifted verbatim out of
 * routes/study.js so that BOTH entry points share it:
 *
 *   1. POST /api/study/generate            — the original "import notes" flow
 *   2. POST /api/recommendations/:id/start — the Next Best Action flow
 *
 * Extracting it was the alternative to letting the academic layer grow its own
 * generator. There is no second study engine: the recommendation route reaches
 * the same summary, 60-second summary, flashcards and quiz the student has
 * always got, and the original flow is unchanged behaviour.
 */
export async function generateStudyKit({
  userId,
  sourceText,
  noteId = null,
  title = 'Study Session',
  subject = 'General',
  difficulty = 'Medium',
  questionCount = 5,
  recommendationId = null,
  focusTopics = [],
}) {
  if (!sourceText || sourceText.trim().length < 20) {
    const err = new Error('Insufficient note text to generate study materials');
    err.statusCode = 400;
    throw err;
  }

  let effectiveNoteId = noteId;

  // If no note was supplied, persist one so the student can revisit the source.
  if (!effectiveNoteId) {
    const newNote = {
      _id: ID.note(),
      userId,
      title,
      subject,
      sourceType: 'generated',
      extractedText: sourceText,
      wordCount: sourceText.split(/\s+/).length,
      createdAt: new Date().toISOString(),
    };
    await dbStore.createNote(newNote);
    effectiveNoteId = newNote._id;
  }

  // AI (Gemini) with the built-in heuristic engine as fallback — untouched.
  const kit = await aiService.generateStudyKit(sourceText, subject, difficulty, questionCount);

  const sessionId = ID.kit();

  const flashcards = (kit.flashcards || []).map((f) => ({
    _id: ID.flashcard(),
    sessionId,
    userId,
    question: f.question,
    answer: f.answer,
    concept: f.concept || 'Key Point',
    difficulty: f.difficulty || difficulty,
    mastery: 'unreviewed',
    createdAt: new Date().toISOString(),
  }));
  await dbStore.createFlashcards(flashcards);

  const quizId = ID.quiz();
  const quiz = {
    _id: quizId,
    sessionId,
    userId,
    topic: subject,
    questions: kit.quizQuestions || [],
    score: null,
    accuracy: null,
    attempted: false,
    createdAt: new Date().toISOString(),
  };
  await dbStore.createQuiz(quiz);

  // Link the kit into the Academic State so the engine can find it later.
  const subjectDoc = await resolveSubject(userId, subject);

  const studySession = {
    _id: sessionId,
    userId,
    noteId: effectiveNoteId,
    title,
    subject,
    difficulty,
    summary: kit.summary,
    sixtySecondSummary: kit.sixtySecondSummary,
    keyConcepts: kit.keyConcepts || [],
    memoryHooks: kit.memoryHooks || [],
    quizId,
    status: 'ready',
    subjectId: subjectDoc._id,
    topicIds: focusTopics,
    recommendationId,
    createdAt: new Date().toISOString(),
  };
  await dbStore.createStudySession(studySession);

  await Note.updateOne({ _id: effectiveNoteId }, { subjectId: subjectDoc._id });

  return { sessionId, session: studySession, flashcards, quiz };
}

/** The client-safe quiz view: correct answers and explanations withheld. */
export function sanitizeQuizForClient(quiz) {
  if (!quiz) return null;
  return {
    _id: quiz._id,
    topic: quiz.topic,
    questions: (quiz.questions || []).map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      concept: q.concept,
      difficulty: q.difficulty,
    })),
  };
}

export default { generateStudyKit, sanitizeQuizForClient };
