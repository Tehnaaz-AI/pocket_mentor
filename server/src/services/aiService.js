import { config } from '../config/index.js';
import { foldDashes } from '../utils/text.js';

let currentKeyIndex = 0;
let currentGroqKeyIndex = 0;
// The model that actually served the most recent successful call, so logs
// name the real model rather than the configured primary after a fallback.
let lastServingModel = null;

function getMaskedKey(key) {
  if (!key || key.length < 8) return '***';
  return '...' + key.slice(-4);
}

/* ==================================================================== *
 * PROVIDER-INDEPENDENT NORMALISATION
 *
 * Everything a provider returns passes through here before the rest of
 * Pocket Mentor sees it, so the application contract is identical whether
 * the content came from Groq, Gemini or the heuristic engine.
 *
 * This exists because language models do not reliably emit the `id` field
 * the quiz grader needs: a real Groq response returned five well-formed
 * questions with `id: undefined`, which made `answers[q.id]` undefined and
 * forced every score to zero. IDs are assigned here, never requested from
 * the model.
 *
 * Policy on bad content: malformed questions and cards are DROPPED, never
 * repaired with invented material. A student must not be quizzed on
 * fabricated educational content.
 * ==================================================================== */

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

/** Maps any casing/spelling onto Easy|Medium|Hard, defaulting to the request's level. */
function normalizeDifficulty(value, fallback = 'Medium') {
  const v = String(value ?? '').trim().toLowerCase();
  const hit = DIFFICULTIES.find(d => d.toLowerCase() === v);
  if (hit) return hit;
  if (v.startsWith('eas') || v === 'beginner' || v === 'low') return 'Easy';
  if (v.startsWith('har') || v === 'advanced' || v === 'high') return 'Hard';
  if (v.startsWith('med') || v === 'intermediate') return 'Medium';
  return DIFFICULTIES.includes(fallback) ? fallback : 'Medium';
}

/** Trimmed non-empty string, with dash variants folded, or ''. */
function cleanText(value) {
  return typeof value === 'string' || typeof value === 'number'
    ? foldDashes(String(value)).replace(/\s+/g, ' ').trim()
    : '';
}

/** Concept names keep their full phrasing — never truncated. */
function cleanConcept(value, fallback = 'General') {
  const c = cleanText(value);
  return c.length ? c : fallback;
}

/**
 * Quiz questions: assign a stable id, require exactly four usable options and
 * an in-range correctOption. Anything failing that is dropped.
 */
function normalizeQuizQuestions(raw, { difficulty = 'Medium', idPrefix = 'q' } = {}) {
  if (!Array.isArray(raw)) return { questions: [], rejected: 0 };
  const questions = [];
  let rejected = 0;

  for (const q of raw) {
    if (!q || typeof q !== 'object') { rejected++; continue; }

    const question = cleanText(q.question);
    const options = Array.isArray(q.options)
      ? q.options.map(cleanText).filter(o => o.length > 0)
      : [];

    // correctOption may arrive as "2" from a model; accept numeric strings.
    const ciRaw = typeof q.correctOption === 'string' ? Number(q.correctOption) : q.correctOption;
    const correctOption = Number.isInteger(ciRaw) ? ciRaw : NaN;

    const usable =
      question.length > 0 &&
      options.length === 4 &&
      new Set(options).size === 4 &&              // four DISTINCT answers
      Number.isInteger(correctOption) &&
      correctOption >= 0 &&
      correctOption < 4;

    if (!usable) { rejected++; continue; }

    questions.push({
      // Assigned here, not by the model — this is the quiz-ID fix.
      id: `${idPrefix}_${questions.length + 1}`,
      question,
      options,
      correctOption,
      explanation: cleanText(q.explanation),
      concept: cleanConcept(q.concept),
      difficulty: normalizeDifficulty(q.difficulty, difficulty),
    });
  }
  return { questions, rejected };
}

/** Flashcards: assign an id, require a question and an answer. */
function normalizeFlashcards(raw, { difficulty = 'Medium', idPrefix = 'fc' } = {}) {
  if (!Array.isArray(raw)) return { flashcards: [], rejected: 0 };
  const flashcards = [];
  let rejected = 0;

  for (const f of raw) {
    if (!f || typeof f !== 'object') { rejected++; continue; }
    const question = cleanText(f.question);
    const answer = cleanText(f.answer);
    if (!question || !answer) { rejected++; continue; }

    flashcards.push({
      id: `${idPrefix}_${flashcards.length + 1}`,
      question,
      answer,
      concept: cleanConcept(f.concept, 'Key Point'),
      difficulty: normalizeDifficulty(f.difficulty, difficulty),
    });
  }
  return { flashcards, rejected };
}

function normalizeMemoryHooks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(h => h && typeof h === 'object')
    .map(h => ({
      concept: cleanConcept(h.concept),
      mnemonic: cleanText(h.mnemonic),
      analogy: cleanText(h.analogy),
      example: cleanText(h.example),
    }))
    .filter(h => h.mnemonic || h.analogy || h.example);
}

/** Concept list: full phrases, de-duplicated case-insensitively, order kept. */
function normalizeKeyConcepts(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const c of raw) {
    const name = cleanConcept(c, '');
    if (!name) continue;
    const k = name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(name);
  }
  return out;
}

function normalizeSixtySecond(raw, { subject = 'General', keyConcepts = [] } = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const keyPoints = Array.isArray(src.keyPoints)
    ? src.keyPoints.map(cleanText).filter(Boolean)
    : [];
  return {
    topic: cleanText(src.topic) || subject,
    coreIdea: cleanText(src.coreIdea),
    keyPoints: keyPoints.length ? keyPoints : keyConcepts.slice(0, 4),
    memorableTakeaway: cleanText(src.memorableTakeaway),
  };
}

/**
 * normalizeStudyKit — the single gate every study kit passes through.
 * Returns the normalised kit plus a `_meta` report (counts + rejections) that
 * callers use for logging and validity checks. `_meta` is stripped before the
 * kit is handed to the application.
 */
export function normalizeStudyKit(kit, { subject = 'General', difficulty = 'Medium' } = {}) {
  const src = kit && typeof kit === 'object' ? kit : {};

  const keyConcepts = normalizeKeyConcepts(src.keyConcepts);
  const { questions, rejected: qRejected } = normalizeQuizQuestions(src.quizQuestions, { difficulty });
  const { flashcards, rejected: fRejected } = normalizeFlashcards(src.flashcards, { difficulty });

  return {
    summary: typeof src.summary === 'string' ? src.summary.trim() : '',
    sixtySecondSummary: normalizeSixtySecond(src.sixtySecondSummary, { subject, keyConcepts }),
    keyConcepts,
    memoryHooks: normalizeMemoryHooks(src.memoryHooks),
    flashcards,
    quizQuestions: questions,
    _meta: {
      quizKept: questions.length,
      quizRejected: qRejected,
      flashcardsKept: flashcards.length,
      flashcardsRejected: fRejected,
      conceptCount: keyConcepts.length,
    },
  };
}

/** Same gate for the Revise Again kit, which has a different top-level shape. */
export function normalizeReviseKit(kit, { difficulty = 'Medium' } = {}) {
  const src = kit && typeof kit === 'object' ? kit : {};
  const { questions, rejected: qRejected } = normalizeQuizQuestions(src.quizQuestions, { difficulty, idPrefix: 'rev_q' });
  const { flashcards, rejected: fRejected } = normalizeFlashcards(src.flashcards, { difficulty, idPrefix: 'rev_fc' });
  return {
    focusExplanation: cleanText(src.focusExplanation),
    memoryHooks: normalizeMemoryHooks(src.memoryHooks),
    flashcards,
    quizQuestions: questions,
    _meta: { quizKept: questions.length, quizRejected: qRejected, flashcardsKept: flashcards.length, flashcardsRejected: fRejected },
  };
}

/** A kit is only usable if it can actually be studied and quizzed. */
function isKitUsable(kit) {
  return !!(kit && kit.summary && kit.quizQuestions?.length > 0 && kit.flashcards?.length > 0);
}

function stripMeta(kit) {
  const { _meta, ...rest } = kit;
  return rest;
}

/** Classifies a provider HTTP failure so logs say what actually went wrong. */
function classifyHttpError(status, bodyText = '') {
  const b = String(bodyText);
  if (status === 401) return { kind: 'auth', retryOtherKey: true, label: 'authentication failed (bad or revoked key)' };
  if (status === 403) {
    const quota = /RESOURCE_EXHAUSTED|quota|rateLimitExceeded/i.test(b);
    return quota
      ? { kind: 'quota', retryOtherKey: true, label: 'quota exhausted' }
      : { kind: 'permission', retryOtherKey: false, label: 'authorization denied for this project/model' };
  }
  if (status === 404) return { kind: 'model', retryOtherKey: false, label: 'model unavailable' };
  if (status === 429) return { kind: 'rate_limit', retryOtherKey: true, label: 'rate limited' };
  if (status >= 500) return { kind: 'server', retryOtherKey: false, label: `provider server error ${status}` };
  return { kind: 'http', retryOtherKey: false, label: `HTTP ${status}` };
}

export const aiService = {
  /**
   * Main entrypoint to generate the comprehensive Study Kit
   */
  async generateStudyKit(noteText, subject = 'General', difficulty = 'Medium', questionCount = 5) {
    if (this.hasProvider()) {
      try {
        const raw = await this.callAIStudyKit(noteText, subject, difficulty, questionCount);
        const kit = normalizeStudyKit(raw, { subject, difficulty });

        if (isKitUsable(kit)) {
          const m = kit._meta;
          console.log(
            `[AI] Study kit from ${this.activeProviderLabel()} — ` +
            `${m.conceptCount} concepts, ${m.flashcardsKept} flashcards, ${m.quizKept} questions` +
            (m.quizRejected || m.flashcardsRejected
              ? ` (dropped ${m.quizRejected} malformed question(s), ${m.flashcardsRejected} card(s))`
              : '')
          );
          return stripMeta(kit);
        }
        console.warn(`[AI] ${this.activeProviderLabel()} output unusable after normalisation ` +
          `(summary:${!!kit.summary} questions:${kit._meta.quizKept} cards:${kit._meta.flashcardsKept}) — falling back`);
      } catch (err) {
        console.warn(`[AI] ${this.activeProviderLabel()} failed: ${err.message}`);
      }
    } else {
      console.warn(`[AI] No API key configured for provider '${config.aiProvider}'`);
    }

    // Resilient heuristic generation engine — normalised through the same gate
    console.warn('[AI] FALLBACK: using heuristic engine (content is NOT model-generated)');
    const heuristic = this.generateHeuristicStudyKit(noteText, subject, difficulty, questionCount);
    return stripMeta(normalizeStudyKit(heuristic, { subject, difficulty }));
  },

  /** Builds the study-kit prompt and sends it through the provider boundary. */
  async callAIStudyKit(noteText, subject, difficulty, questionCount) {
    if (config.aiProvider === 'gemini') {
      // Preserves the original Gemini path exactly.
      return this.callGeminiModel(noteText, subject, difficulty, questionCount);
    }
    return this.callAI(this.buildStudyKitPrompt(noteText, subject, difficulty, questionCount));
  },

  /**
   * Generates targeted revision materials focused strictly on weak concepts
   */
  async generateReviseAgainKit(noteText, weakConcepts, previousQuestions = []) {
    if (this.hasProvider()) {
      try {
        const prompt = `You are a patient AI study mentor. The student took a quiz on their notes and struggled with these specific concepts: ${weakConcepts.join(', ')}.
Generate a focused revision kit for ONLY these weak concepts based on their notes:
"""
${noteText.slice(0, 8000)}
"""
Return JSON matching this exact structure:
{
  "focusExplanation": "Clear, gentle breakdown clarifying the confusing points for: ${weakConcepts.join(', ')}",
  "memoryHooks": [
    { "concept": "Concept Name", "mnemonic": "Helpful acronym or rhythm", "analogy": "Everyday real world analogy", "example": "Concrete example" }
  ],
  "flashcards": [
    { "question": "...", "answer": "...", "concept": "...", "difficulty": "Medium" }
  ],
  "quizQuestions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctOption": 0,
      "explanation": "Why this is correct...",
      "concept": "...",
      "difficulty": "Medium"
    }
  ]
}`;
        const response = await this.callAI(prompt);
        const kit = normalizeReviseKit(response, { difficulty: 'Medium' });
        if (kit.quizQuestions.length > 0) {
          console.log(`[AI] Revise kit from ${this.activeProviderLabel()} — ` +
            `${kit.quizQuestions.length} questions, ${kit.flashcards.length} cards`);
          return stripMeta(kit);
        }
        console.warn(`[AI] ${this.activeProviderLabel()} revise output had no usable questions — falling back`);
      } catch (e) {
        console.warn(`[AI] ${this.activeProviderLabel()} revise failed: ${e.message}`);
      }
    }

    console.warn('[AI] FALLBACK: heuristic revise kit (content is NOT model-generated)');
    return stripMeta(normalizeReviseKit(
      this.generateHeuristicReviseKit(noteText, weakConcepts), { difficulty: 'Medium' }
    ));
  },

  /**
   * Ask My Notes: Question answering grounded in note text
   */
  async askMyNotes(noteText, query) {
    if (this.hasProvider()) {
      try {
        const prompt = `You are a strict source-grounded study tutor. A student asks a question about their notes.
Student Question: "${query}"
Student Notes:
"""
${noteText.slice(0, 10000)}
"""
INSTRUCTIONS:
1. Answer strictly based on the provided notes.
2. If the answer is in the notes, answer clearly and quote the exact sentence or paragraph as "sourceExcerpt".
3. If the answer is not mentioned in the notes, state politely that the notes do not mention this, but give a brief general context if helpful.
Return valid JSON:
{
  "answer": "...",
  "sourceExcerpt": "...",
  "isFoundInNotes": true
}`;
        const res = await this.callAI(prompt);
        if (res && typeof res.answer === 'string' && res.answer.trim()) {
          console.log(`[AI] Ask My Notes answered by ${this.activeProviderLabel()}`);
          return {
            answer: res.answer.trim(),
            sourceExcerpt: typeof res.sourceExcerpt === 'string' ? res.sourceExcerpt.trim() : '',
            isFoundInNotes: !!res.isFoundInNotes,
          };
        }
        console.warn(`[AI] ${this.activeProviderLabel()} returned no answer — falling back`);
      } catch (err) {
        console.warn(`[AI] ${this.activeProviderLabel()} Ask My Notes failed: ${err.message}`);
      }
    }

    // Heuristic grounded search in notes
    console.warn('[AI] FALLBACK: heuristic Ask My Notes (answer is NOT model-generated)');
    return this.heuristicAskNotes(noteText, query);
  },

  /* ================================================================ *
   * PROVIDER DISPATCH
   * ================================================================ */

  /** Is the configured provider usable at all (i.e. does it have a key)? */
  hasProvider() {
    if (config.aiProvider === 'groq') {
      return (config.groqApiKeys?.length > 0) || !!config.groqApiKey;
    }
    return (config.geminiApiKeys?.length > 0) || !!config.geminiApiKey;
  },

  activeProviderLabel() {
    const provider = config.aiProvider === 'groq' ? 'Groq' : 'Gemini';
    const configured = config.aiProvider === 'groq' ? config.groqModels[0] : config.geminiModels[0];
    return `${provider} (${lastServingModel || configured})`;
  },

  /**
   * The provider boundary. Takes a prompt, returns parsed JSON.
   *
   * Provider-specific differences — endpoint, auth style, request shape and
   * where the text sits in the response — live entirely inside the two
   * callers below. Everything upstream of this function is provider-agnostic.
   */
  async callAI(promptText) {
    if (config.aiProvider === 'gemini') return this.callGeminiRaw(promptText);
    return this.callGroqRaw(promptText);
  },

  /**
   * Groq via the OpenAI-compatible chat completions API.
   *
   * Deliberately mirrors callGeminiRaw's contract (prompt in, parsed JSON
   * out) and its key x model cascade, so the two are interchangeable.
   *
   * Notes from the smoke test that shaped this:
   *  - gpt-oss models return chain-of-thought in a SEPARATE `message.reasoning`
   *    field, leaving `message.content` as clean JSON. No stripping needed.
   *  - `response_format: {type:'json_object'}` is the analogue of Gemini's
   *    `responseMimeType: 'application/json'`.
   */
  async callGroqRaw(promptText) {
    const keys = config.groqApiKeys?.length > 0
      ? config.groqApiKeys
      : (config.groqApiKey ? [config.groqApiKey] : []);

    if (keys.length === 0) {
      throw new Error('No Groq API keys configured');
    }

    const models = config.groqModels?.length > 0
      ? config.groqModels
      : ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

    let lastError = null;

    for (let k = 0; k < keys.length; k++) {
      const keyIdx = (currentGroqKeyIndex + k) % keys.length;
      const activeKey = keys[keyIdx];

      for (const model of models) {
        const started = Date.now();
        try {
          const response = await fetch(`${config.groqBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${activeKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: promptText }],
              temperature: 0.2,
              response_format: { type: 'json_object' }
            })
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            const finish = data.choices?.[0]?.finish_reason;

            if (finish === 'length') {
              lastError = new Error(`Groq [${model}] response truncated (finish_reason=length)`);
              console.warn(`[AI] Groq ${model} truncated output — trying next model`);
              continue;
            }
            if (!content) {
              lastError = new Error(`Groq [${model}] returned an empty message`);
              console.warn(`[AI] Groq ${model} returned no content — trying next model`);
              continue;
            }

            try {
              const parsed = JSON.parse(content);
              currentGroqKeyIndex = keyIdx; // stick with the key that worked
              lastServingModel = model;
              console.log(`[AI] Groq ${model} OK in ${Date.now() - started}ms (${data.usage?.completion_tokens ?? '?'} completion tokens)`);
              return parsed;
            } catch (parseErr) {
              lastError = new Error(`Groq [${model}] returned malformed JSON: ${parseErr.message}`);
              console.warn(`[AI] Groq ${model} malformed JSON — trying next model`);
              continue;
            }
          }

          const errText = await response.text();
          const { kind, retryOtherKey, label } = classifyHttpError(response.status, errText);
          lastError = new Error(`Groq [${model} / ${getMaskedKey(activeKey)}] ${response.status} ${kind}: ${errText.slice(0, 200)}`);

          if (retryOtherKey) {
            console.warn(`[AI] Groq key ${getMaskedKey(activeKey)} ${label} on ${model}. Trying next key...`);
            break; // next key, not next model
          }
          console.warn(`[AI] Groq ${model} ${label}. Trying next model...`);
        } catch (networkErr) {
          lastError = networkErr;
          console.warn(`[AI] Groq network error on ${model}: ${networkErr.message}`);
        }
      }
    }

    throw lastError || new Error('All Groq keys and models exhausted');
  },

  /**
   * Gemini API REST caller with automatic key rotation and model fallback
   */
  async callGeminiRaw(promptText) {
    const keys = config.geminiApiKeys?.length > 0 
      ? config.geminiApiKeys 
      : (config.geminiApiKey ? [config.geminiApiKey] : []);

    if (keys.length === 0) {
      throw new Error('No Gemini API keys configured');
    }

    const models = config.geminiModels?.length > 0 
      ? config.geminiModels 
      // Stable primary + one fallback. gemini-1.5-*/2.0-flash are retired and
      // gemini-2.5-flash is closed to new users; both 404 on generateContent.
      : ['gemini-3.6-flash', 'gemini-flash-latest'];

    let lastError = null;

    // Loop through keys starting from current active key
    for (let k = 0; k < keys.length; k++) {
      const keyIdx = (currentKeyIndex + k) % keys.length;
      const activeKey = keys[keyIdx];

      // Try each model in priority cascade
      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2
              }
            })
          });

          if (response.ok) {
            const data = await response.json();
            const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText) {
              currentKeyIndex = keyIdx; // Stick with successful key
              return JSON.parse(candidateText);
            }
          }

          const errText = await response.text();
          lastError = new Error(`Gemini [${model} / ${getMaskedKey(activeKey)}] status ${response.status}: ${errText}`);

          const isQuotaOrLimit = response.status === 429 || 
            response.status === 403 || 
            errText.includes('RESOURCE_EXHAUSTED') || 
            errText.includes('quota') ||
            errText.includes('rateLimitExceeded');

          if (isQuotaOrLimit) {
            console.warn(`[AI Key Rotation] Key ${getMaskedKey(activeKey)} reached limit on ${model}. Rotating to fallback key...`);
            break; // Switch to next key immediately
          } else {
            console.warn(`[AI Model Fallback] Model ${model} returned ${response.status}. Trying next fallback model...`);
          }
        } catch (networkErr) {
          lastError = networkErr;
          console.warn(`[AI Network Error] Key ${getMaskedKey(activeKey)}:`, networkErr.message);
        }
      }
    }

    throw lastError || new Error('All Gemini fallback keys and models exhausted');
  },

  /**
   * The study-kit prompt. Shared verbatim by every provider so switching
   * providers cannot change what is asked for. Text is unchanged from the
   * original Gemini implementation.
   */
  buildStudyKitPrompt(noteText, subject, difficulty, questionCount) {
    const prompt = `You are Pocket Mentor, an expert AI revision coach. A student has provided their class notes for the subject "${subject}".
Generate a complete, high-yield revision kit based on the notes below.

NOTES CONTENT:
"""
${noteText.slice(0, 12000)}
"""

REQUIREMENTS:
1. Summary: In-depth, well-structured revision notes with clear markdown headings, bold terms, bullet points, and core mechanisms.
2. SixtySecondSummary: A high-density 1-minute read with:
   - topic: High level topic name
   - coreIdea: 1-2 sentence elevator pitch of the entire topic
   - keyPoints: 3 to 5 quick high-yield takeaways
   - memorableTakeaway: A single catchy, memorable punchline sentence.
3. keyConcepts: Array of 4-7 key concepts or terms covered.
4. memoryHooks: Array of 3-4 objects with { concept, mnemonic, analogy, example } to make hard concepts unforgettable.
5. flashcards: Array of 6-10 active recall question/answer pairs { question, answer, concept, difficulty }.
6. quizQuestions: Exactly ${questionCount} multiple-choice questions matching "${difficulty}" difficulty.
   Each quiz question must have:
   - question: Clear, unambiguous question testing understanding
   - options: Array of 4 distinct answers
   - correctOption: Index (0, 1, 2, or 3) of the correct answer
   - explanation: Clear rationale explaining why the correct answer is right and why others are wrong
   - concept: The specific concept tested
   - difficulty: "${difficulty}"

Return strictly valid JSON matching this schema:
{
  "summary": "...",
  "sixtySecondSummary": {
    "topic": "...",
    "coreIdea": "...",
    "keyPoints": ["...", "..."],
    "memorableTakeaway": "..."
  },
  "keyConcepts": ["..."],
  "memoryHooks": [
    { "concept": "...", "mnemonic": "...", "analogy": "...", "example": "..." }
  ],
  "flashcards": [
    { "question": "...", "answer": "...", "concept": "...", "difficulty": "Easy|Medium|Hard" }
  ],
  "quizQuestions": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correctOption": 0,
      "explanation": "...",
      "concept": "...",
      "difficulty": "${difficulty}"
    }
  ]
}`;
    return prompt;
  },

  /** Gemini study-kit call — preserved for provider switching. */
  async callGeminiModel(noteText, subject, difficulty, questionCount) {
    return this.callGeminiRaw(
      this.buildStudyKitPrompt(noteText, subject, difficulty, questionCount)
    );
  },

  /**
   * Heuristic engine that intelligently generates a complete study kit
   * from any text content when offline or API key not present.
   */
  generateHeuristicStudyKit(text, subject, difficulty, questionCount = 5) {
    const lines = text
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    // Extract potential headings and key bullet points
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 20);
    const sentences = text
      .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
      .split("|")
      .map(s => s.trim())
      .filter(s => s.length > 25 && s.length < 250);

    // Extract key concepts from capital phrases, colons, or definitions
    const conceptSet = new Set();
    const conceptMap = [];

    lines.forEach(l => {
      const defMatch = l.match(/^([A-Za-z0-9\s]{3,35})\s*[:=–-]\s*(.+)$/);
      if (defMatch) {
        const cName = defMatch[1].replace(/^[#*-]\s*/, '').trim();
        const cDesc = defMatch[2].trim();
        if (cName.length > 2 && cName.length < 40) {
          conceptSet.add(cName);
          conceptMap.push({ name: cName, desc: cDesc });
        }
      }
    });

    // If few concepts found from definitions, extract frequent capitalized terms
    if (conceptMap.length < 3) {
      const words = text.match(/\b[A-Z][a-zA-Z]{3,}\b/g) || [];
      const freq = {};
      words.forEach(w => {
        if (!['This', 'That', 'These', 'Those', 'There', 'When', 'What', 'Where', 'Which', 'With', 'From'].includes(w)) {
          freq[w] = (freq[w] || 0) + 1;
        }
      });
      Object.keys(freq)
        .sort((a, b) => freq[b] - freq[a])
        .slice(0, 6)
        .forEach(w => {
          conceptSet.add(w);
          const foundSentence = sentences.find(s => s.includes(w)) || `Important concept relating to ${subject}.`;
          conceptMap.push({ name: w, desc: foundSentence });
        });
    }

    const keyConcepts = Array.from(conceptSet).slice(0, 6);
    if (keyConcepts.length === 0) {
      keyConcepts.push(subject, 'Core Mechanism', 'Fundamental Principle', 'Applications');
    }

    // Build Sixty Second Summary
    const firstSentence = sentences[0] || `An overview of ${subject} focusing on core fundamentals and active revision.`;
    const sixtySecondSummary = {
      topic: subject !== 'General' ? subject : (keyConcepts[0] || 'Key Subject Concepts'),
      coreIdea: firstSentence,
      keyPoints: sentences.slice(1, 5).map(s => s.replace(/^[•*-]\s*/, '')),
      memorableTakeaway: `Master the connection between ${keyConcepts.slice(0, 2).join(' and ')} to ace your assessments!`
    };

    // Build Detailed Structured Summary
    let summary = `## Revision Guide: ${subject}\n\n`;
    summary += `### Executive Overview\n${firstSentence}\n\n`;
    summary += `### Core Concepts & Pillars\n`;
    keyConcepts.forEach((c, idx) => {
      const desc = conceptMap.find(m => m.name === c)?.desc || sentences[idx + 1] || `Key foundational topic in this domain.`;
      summary += `- **${c}**: ${desc}\n`;
    });
    summary += `\n### Key Mechanisms & Principles\n`;
    sentences.slice(2, 7).forEach(s => {
      summary += `1. ${s}\n`;
    });
    summary += `\n> **Exam Tip**: Pay special attention to distinguishing definitions and boundary cases during quizzes.`;

    // Build Flashcards
    const flashcards = [];
    conceptMap.slice(0, 8).forEach((item, idx) => {
      flashcards.push({
        id: `fc_${idx + 1}`,
        question: `What is the definition and role of ${item.name}?`,
        answer: item.desc,
        concept: item.name,
        difficulty: idx % 3 === 0 ? 'Easy' : idx % 3 === 1 ? 'Medium' : 'Hard'
      });
    });

    // If we need more flashcards, extract from sentences
    while (flashcards.length < 5 && sentences.length > flashcards.length) {
      const s = sentences[flashcards.length];
      flashcards.push({
        id: `fc_${flashcards.length + 1}`,
        question: `Explain: "${s.slice(0, 60)}..."`,
        answer: s,
        concept: keyConcepts[flashcards.length % keyConcepts.length],
        difficulty: 'Medium'
      });
    }

    // Build Memory Hooks
    const memoryHooks = keyConcepts.slice(0, 4).map((c, i) => {
      const acronym = c.split(' ').map(w => w[0]).join('').toUpperCase() || c.slice(0, 3).toUpperCase();
      return {
        concept: c,
        mnemonic: `Remember [${acronym}]: ${c} drives the process step-by-step.`,
        analogy: `Think of ${c} like a traffic controller directing data flow so no collisions occur.`,
        example: `In real applications, ${c} ensures predictability and high performance.`
      };
    });

    // Build Quiz Questions
    const quizQuestions = [];
    const count = Math.min(Math.max(questionCount, 3), 10);

    for (let i = 0; i < count; i++) {
      const currentConcept = keyConcepts[i % keyConcepts.length];
      const matchingDef = conceptMap.find(m => m.name === currentConcept)?.desc || sentences[i % sentences.length] || `A primary component of ${subject}`;
      
      // Plausible distractors
      const otherSentences = sentences.filter(s => s !== matchingDef);
      const distractor1 = otherSentences[0] || `An unrelated legacy configuration used in older architectures.`;
      const distractor2 = otherSentences[1] || `A temporary bypass mechanism that disables validation checks.`;
      const distractor3 = otherSentences[2] || `A passive storage layer that does not perform active execution.`;

      const options = [matchingDef, distractor1, distractor2, distractor3];
      // Shuffle options and find correct index
      const shuffled = [...options].sort(() => 0.5 - Math.random());
      const correctOption = shuffled.indexOf(matchingDef);

      quizQuestions.push({
        id: `q_${i + 1}`,
        question: `According to the revision notes, which of the following best describes "${currentConcept}"?`,
        options: shuffled,
        correctOption,
        explanation: `"${currentConcept}" is specifically defined as: ${matchingDef}`,
        concept: currentConcept,
        difficulty
      });
    }

    return {
      summary,
      sixtySecondSummary,
      keyConcepts,
      memoryHooks,
      flashcards,
      quizQuestions
    };
  },

  generateHeuristicReviseKit(noteText, weakConcepts) {
    const focusExplanation = `Focusing on your review areas: ${weakConcepts.join(', ')}. Review these distilled principles to convert your mistakes into mastery!`;
    const flashcards = weakConcepts.map((c, idx) => ({
      id: `rev_fc_${idx + 1}`,
      question: `Deep Reinforcement: What are the critical conditions and behavior of ${c}?`,
      answer: `Crucial Rule for ${c}: Focus on where errors typically occur, review edge-cases, and confirm definition accuracy against the source text.`,
      concept: c,
      difficulty: 'Hard'
    }));

    const quizQuestions = weakConcepts.map((c, idx) => {
      const correct = `It directly controls and verifies the operations of ${c} according to the source notes.`;
      const options = [
        correct,
        `It bypasses ${c} entirely without validation.`,
        `It causes a permanent deadlock with no recovery path.`,
        `It is deprecated and should never be used in revision.`
      ];
      return {
        id: `rev_q_${idx + 1}`,
        question: `[Targeted Drill] To avoid previous mistakes on ${c}, select the true statement:`,
        options,
        correctOption: 0,
        explanation: `Targeted review confirms: ${correct}`,
        concept: c,
        difficulty: 'Medium'
      };
    });

    const memoryHooks = weakConcepts.map(c => ({
      concept: c,
      mnemonic: `[FIX-${c.slice(0, 3).toUpperCase()}]: Focus on core invariants first.`,
      analogy: `Imagine ${c} as a safety checkpoint—if conditions are unmet, pause and verify.`,
      example: `Applying this rule prevents the common pitfall you encountered.`
    }));

    return {
      focusExplanation,
      memoryHooks,
      flashcards,
      quizQuestions
    };
  },

  heuristicAskNotes(noteText, query) {
    const qLower = query.toLowerCase();
    const sentences = noteText
      .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
      .split("|")
      .map(s => s.trim())
      .filter(Boolean);

    // Score sentences by query word matches
    const words = qLower.split(/\W+/).filter(w => w.length > 3);
    let bestSentence = '';
    let bestScore = 0;

    sentences.forEach(s => {
      const sLower = s.toLowerCase();
      let matchCount = 0;
      words.forEach(w => {
        if (sLower.includes(w)) matchCount++;
      });
      if (matchCount > bestScore) {
        bestScore = matchCount;
        bestSentence = s;
      }
    });

    if (bestScore > 0 && bestSentence) {
      return {
        answer: `Based on your notes: "${bestSentence}". This directly addresses your question regarding "${query}".`,
        sourceExcerpt: bestSentence,
        isFoundInNotes: true
      };
    }

    return {
      answer: `Your uploaded notes do not appear to contain a direct mention of "${query}". You may want to check if this topic was covered in a different lecture or section.`,
      sourceExcerpt: noteText.slice(0, 180) + '...',
      isFoundInNotes: false
    };
  }
};
