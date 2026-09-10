# 🎓 Pocket Mentor — AI-Powered Study Assistant & Personal Revision Coach

> **"Turn messy notes into your personal active revision kit."**

Pocket Mentor is a production-grade full-stack web application designed for students and educators. It transforms unstructured class notes, uploaded lecture PDFs, and slides into structured active-learning revision tools—and crucially **closes the learning loop** by diagnosing weak concepts from quiz attempts and generating targeted reinforcement sessions.

---

## 🌟 Core Differentiator: The Closed Learning Loop

Most AI tools are passive summarizers. Pocket Mentor functions as an active revision coach:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Raw Lecture   │ ----> │ AI Synthesis:   │ ----> │  Active Recall  │
│ Notes / PDF/DOCX│       │ 60s + Summaries │       │   Flashcards    │
└─────────────────┘       └─────────────────┘       └────────┬────────┘
                                                             │
┌─────────────────┐       ┌─────────────────┐       ┌────────▼────────┐
│  Revise Again   │ <---- │  Smart Weakness │ <---- │ Diagnostic MCQ  │
│ Targeted Drills │       │       Map       │       │    Quiz Engine  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 🚀 Key Features

### 1. 📥 Ingestion & Pre-Processing
- **Multi-Format Uploads**: Support for `.pdf`, `.docx`, and `.txt` files with automated text extraction and cleaning.
- **Direct Paste & Editable Preview**: Review and tweak raw text before triggering AI generation.
- **1-Click Preloaded Test Notes**: Includes pre-configured notes for *Computer Science (Concurrency)*, *Biology (Cellular Respiration)*, and *Machine Learning (Optimization)* for instant testing.

### 2. ⚡ AI Synthesis Engine
- **60-Second Revision**: High-yield elevator pitch, key takeaways, and a memorable takeaway sentence.
- **Audio Narration (TTS)**: Built-in voice playback using the Web Speech API so students can listen on the go.
- **Detailed Structured Summary**: Sectioned markdown guide with core mechanisms and exam tips.
- **AI Memory Hooks**: Mnemonics, real-world analogies, and concrete examples to anchor complex ideas.
- **Staged AI Visualizer**: Real animated processing steps (*Reading Notes → Understanding → Creating Cards → Building Quiz → Ready*).

### 3. 🗂️ Active Recall Flashcards
- **Interactive 3D Deck**: Realistic 3D card flips with smooth CSS perspective.
- **Spaced Repetition Mastery**: Rate cards as `Easy`, `Medium`, or `Hard` (keyboard shortcuts: `Space` to flip, `1`/`2`/`3` to rate).
- **Deck Controls**: Shuffle cards and track card progress.

### 4. 📝 Diagnostic Quiz & Exam Mode
- **Multiple-Choice Questions**: Evaluates conceptual understanding with distractors and detailed explanations.
- **Exam Mode**: Integrated countdown timer for simulated test conditions.
- **Question Palette**: Quick question jumping and answer tracking.
- **Celebratory Feedback**: Dynamic confetti animation on high performance.

### 5. 🎯 Smart Weakness Map & Revise Again Loop
- **Automated Diagnostic**: Detects which concepts caused incorrect answers.
- **Visual Mastery Nodes**: Categorizes topics as `Mastered`, `Improving`, or `Needs Review`.
- **1-Click Revise Again**: Instantly generates a targeted reinforcement mini-quiz and flashcards dedicated exclusively to the student's weak concepts.

### 6. 💬 Ask My Notes (RAG Grounded Q&A)
- Interactive question-answering strictly grounded in the student's uploaded notes.
- Highlights exact verbatim citations and excerpts to eliminate AI hallucinations.

---

## 🧠 The Academic OS Layer

Pocket Mentor answers two questions, not one.

| Question | Answered by | How |
| :--- | :--- | :--- |
| **"What should I study next, and why?"** | Academic OS | Deterministic priority engine |
| **"How should I study it?"** | Learning Engine | AI summaries, flashcards, quizzes |

The closed loop:

```
Academic State (goals, topics, mastery, deadlines, study time)
        ↓
Priority Engine  —  Weakness + Recent Failure + Deadline Urgency
                    + Goal Relevance + Time Fit  =  0–50
        ↓
Next Best Action  —  "Dynamic Programming, 90 minutes"  + why
        ↓
EXISTING Study Workspace  —  Summary · 60s Summary · Flashcards · Quiz
        ↓
Quiz submission  —  deterministic scoring, per-concept diagnostics
        ↓
Performance Update  —  topic mastery moves
        ↓
Academic State UPDATED  →  new Next Best Action
```

### How the two halves connect

The join is **topic identity**. The AI extracts concepts from your notes
("Mutual Exclusion", "Hold and Wait"); `services/topicResolver.js` resolves
those strings to real `Topic` documents, creating them on first sight. So your
topic catalogue **grows out of your own notes** — import notes, take a quiz,
and the priority engine has something to reason about. No setup wizard.

Going the other way, `POST /api/recommendations/:id/start` looks up the notes
that cover the recommended topic and hands them to the *same* kit generator
`/api/study/generate` uses (`services/studyKitService.js`). There is exactly one
study engine. If a topic has no notes yet, the recommendation says so and sends
you to the importer rather than inventing content.

### The AI boundary

| Deterministic (never AI) | AI-generated |
| :--- | :--- |
| Quiz score, accuracy | Detailed summary |
| Per-concept diagnostics | 60-second summary |
| Topic mastery (EMA, α = 0.4) | Flashcards |
| All five priority factors | Quiz questions & explanations |
| Priority score & ranking | Memory hooks |
| Time-fitted plan (45/30/15) | Ask My Notes answers |

The LLM is never asked to decide a number. Recommendation reasoning is
templated, so it is instant, offline and identical on every run.

### Data ownership — one source of truth each

| Data | Owner |
| :--- | :--- |
| Topic mastery | `Topic.masteryScore` (the label is derived from it) |
| Quiz results | `Quiz` |
| Per-topic score history | **derived** from `Quiz.gradedQuestions` |
| Study kit | `StudyKit` (was `studySessions`) |
| Time studied | `StudyLog` |
| Weakness / priority | **derived**, never stored |
| Progress payload | **derived** from `Topic` + `Quiz` + `User` |

The old `progress` document is gone. `GET /api/progress` returns the identical
shape, assembled from the models that now own the data, so the Progress and
Dashboard screens were not touched.

### Academic OS endpoints

```
GET  /api/recommendations/next          What should I do today?
POST /api/recommendations/generate      Re-run the priority engine
POST /api/recommendations/:id/start     Build the kit -> Study Workspace
PUT  /api/recommendations/:id/skip

GET  PUT    /api/academic/profile       incl. dailyStudyMinutes (drives timeFit)
GET  POST   /api/academic/subjects
GET  POST   PUT /api/academic/topics    ?weak=true
GET  POST   PUT DELETE /api/academic/goals
GET  POST   PUT DELETE /api/academic/deadlines
GET  POST   PUT DELETE /api/academic/tasks
GET  POST   /api/academic/assessments   external/offline scores only
```

### Known limitations

1. **Timezone** — "today" uses server-local day boundaries.
2. **Concurrent quiz submissions** on one topic can lose a mastery update (read-modify-write).
3. **Editing an assessment** does not retroactively rewind mastery.
4. **Topic granularity** follows whatever the AI extracts, so unusual note formatting can produce coarse or oddly-named topics; aliases absorb most spelling variants.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Canvas Confetti.
- **Backend**: Node.js, Express.js, Multer, `pdf-parse`, `mammoth`, JWT, `bcryptjs`.
- **Database**: MongoDB + Mongoose. (Until the Academic OS merge this was a flat JSON file at `server/data/store.json`; a pre-merge copy is kept in `server/data/archive/` and `npm run migrate --prefix server` imports it.)
- **AI Integration**: Google Gemini API (`gemini-1.5-flash` / `gemini-2.0`) with a built-in algorithmic heuristic NLP engine for offline or zero-key operation.

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js (v18+) and npm installed.

### 1. Installation
In the project root, run:
```bash
npm run install:all
```
*(Or `npm install` inside both `server/` and `client/` directories)*

### 2. Environment Configuration
Backend settings are in `server/.env`:
```env
PORT=5001
JWT_SECRET=pocket_mentor_super_jwt_secret_998877
CLIENT_URL=http://localhost:5173

# Primary Gemini API Key
GEMINI_API_KEY=

# Fallback Gemini Keys for reaching higher quotas / handling rate limits
# (Supports comma-separated keys or dedicated fallback variables)
GEMINI_API_KEYS=key1,key2,key3
GEMINI_FALLBACK_KEY_1=
GEMINI_FALLBACK_KEY_2=

# Fallback Model Priority Cascade (rotates automatically if rate limits or errors occur)
GEMINI_MODELS=gemini-1.5-flash,gemini-2.0-flash,gemini-1.5-pro

MONGODB_URI=mongodb://localhost:27017/pocketmentor
```
*(If no API keys are supplied or if all quotas are reached, the application automatically cascades to its resilient local heuristic study generator without crashing)*

### 3. Running the Application
Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Server starts on http://localhost:5001
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Vite client starts on http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser!

---

## 🧪 Recommended Demo Flow for Evaluators

1. **Open Landing Page**: Click the glowing **"Launch Instant 1-Click Demo"** button.
2. **Import Notes**: Click any of the preloaded buttons (e.g. **"Computer Science: Concurrency & Deadlocks"**).
3. **Generate**: Click **"Generate Structured Study Kit"** and watch the stage-based animated synthesizer.
4. **Listen**: Open the **60s Revision** tab and click **"Listen Narration"**.
5. **Flashcards**: Switch to **Flashcards** and click or press `Space` to flip, then rate card difficulty.
6. **Take Quiz**: Switch to **Diagnostic Quiz**, toggle **Exam Mode**, and answer questions.
7. **Score & Weakness Map**: View your score, confetti, and the **Smart Weakness Map** highlighting missed topics.
8. **Revise Again**: Click **"Revise Weak Concepts Now"** to experience the closed learning loop with a targeted mini-quiz!
9. **Ask My Notes**: In the workspace, type questions like *"What are the Coffman conditions?"* to see source-grounded answers and excerpts.

---

## 📡 REST API Blueprint

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register student account |
| `POST` | `/api/auth/login` | Log in existing student |
| `POST` | `/api/auth/guest` | Instant 1-click guest login |
| `GET` | `/api/auth/me` | Fetch authenticated student profile |
| `POST` | `/api/notes/upload` | Upload and extract PDF, DOCX, or TXT file |
| `POST` | `/api/notes/paste` | Save pasted note text |
| `GET` | `/api/notes` | List all notes for user |
| `POST` | `/api/study/generate` | Synthesize complete study kit (Summary, 60s, Flashcards, Quiz) |
| `GET` | `/api/study/:sessionId` | Retrieve active study kit session |
| `POST` | `/api/study/:sessionId/ask` | Ask My Notes grounded Q&A with citations |
| `POST` | `/api/study/flashcards/:id/rate` | Save spaced-repetition card mastery |
| `POST` | `/api/quiz/:id/submit` | Submit answers, calculate score & diagnose weak concepts |
| `POST` | `/api/quiz/:id/revise` | Generate targeted Revise Again reinforcement drill |
| `GET` | `/api/dashboard` | Dashboard metrics, streak, and revision-due alerts |
| `GET` | `/api/progress` | Long-term mastery index and quiz history |

---

## 🏆 Project Highlights

- **Zero-Crash Resilience**: Runs flawlessly out-of-the-box with or without external API keys or local MongoDB daemons.
- **Glassmorphic Dark UI**: High-contrast, accessibility-aware typography (`Plus Jakarta Sans` & `JetBrains Mono`) with subtle glow aesthetics.
- **Keyboard Friendly**: Accessible card flipping, rating, and question navigation.
- **Built strictly against the SRS specification document.**
