# Pocket Mentor — Project Documentation

> **AI-Powered Study Assistant & Personal Revision Coach**

---

## Table of Contents

1. [Project Objective / Problem Statement](#1-project-objective--problem-statement)
2. [Proposed Solution](#2-proposed-solution)
3. [Key Features](#3-key-features)
4. [Technologies Used](#4-technologies-used)
5. [Implementation Details](#5-implementation-details)
   - [5.1 System Architecture](#51-system-architecture)
   - [5.2 Backend Architecture](#52-backend-architecture)
   - [5.3 Database Schema Design](#53-database-schema-design)
   - [5.4 AI Integration Layer](#54-ai-integration-layer)
   - [5.5 Priority Engine & Recommendation System](#55-priority-engine--recommendation-system)
   - [5.6 Authentication & Security](#56-authentication--security)
   - [5.7 REST API Reference](#57-rest-api-reference)
   - [5.8 Data Flow & Closed Learning Loop](#58-data-flow--closed-learning-loop)
6. [Future Scope](#6-future-scope)
7. [References / Bibliography](#7-references--bibliography)

---

## 1. Project Objective / Problem Statement

### Context

Students across academic institutions face a recurring challenge in transforming raw, unstructured class notes — whether handwritten, typed, or captured from lecture slides — into effective revision material. The conventional study workflow is fundamentally *passive*: students read notes, highlight text, and hope repetition leads to retention. Research in cognitive science consistently demonstrates that passive re-reading is one of the least effective learning strategies, yet it remains the most widely practised.

### Problem Statement

The core problems this project addresses are:

1. **Passive Learning Dominance**: The majority of student study time is spent re-reading notes rather than engaging in active recall, spaced repetition, or self-testing — strategies proven to be significantly more effective for long-term retention.

2. **Unstructured Input**: Lecture notes arrive in heterogeneous formats (PDF, DOCX, plain text, handwritten scans) and quality levels. There is no automated pathway from raw notes to structured, revision-ready material.

3. **No Diagnostic Feedback Loop**: After studying, most students have no way to objectively identify *which specific concepts* they failed to learn. They know they scored poorly, but not *why* or *what to do about it*.

4. **No Intelligent Prioritisation**: Students must decide *what* to study next based on gut feeling rather than data. The student with an exam in 3 days, a weak mastery score on a topic, and an active learning goal has no system that synthesises these signals into a single actionable recommendation.

5. **Fragmented Tools**: Existing solutions address individual aspects (flashcard apps, quiz generators, AI summarisers) but none close the loop from ingestion → synthesis → assessment → diagnosis → targeted reinforcement.

### Target Users

- **Students** (undergraduate and postgraduate) who need to convert lecture notes into exam-ready revision tools.
- **Self-learners** preparing for competitive exams, certifications, or professional development.
- **Educators** seeking a platform that can auto-generate formative assessment instruments from their teaching material.

---

## 2. Proposed Solution

### Overview

**Pocket Mentor** is a production-grade, full-stack web application that transforms unstructured class notes into a structured, active-learning revision ecosystem — and then **closes the learning loop** by diagnosing weak concepts from quiz attempts and generating targeted reinforcement sessions.

### The Closed Learning Loop

Unlike passive AI summarisers, Pocket Mentor functions as an **active revision coach**:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Raw Lecture    │ ────▶ │  AI Synthesis:  │ ────▶ │  Active Recall  │
│ Notes / PDF/DOCX│       │ 60s + Summaries │       │   Flashcards    │
└─────────────────┘       └─────────────────┘       └────────┬────────┘
                                                             │
┌─────────────────┐       ┌─────────────────┐       ┌────────▼────────┐
│  Revise Again   │ ◀──── │  Smart Weakness │ ◀──── │ Diagnostic MCQ  │
│ Targeted Drills │       │       Map       │       │    Quiz Engine  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### The Academic OS Layer

On top of the revision engine, Pocket Mentor adds a deterministic **Academic OS** that answers the question *"What should I study next, and why?"*:

```
Academic State (goals, topics, mastery, deadlines, study time)
        ↓
Priority Engine  —  Weakness + Recent Failure + Deadline Urgency
                    + Goal Relevance + Time Fit  =  0–50
        ↓
Next Best Action  —  "Dynamic Programming, 90 minutes"  +  why
        ↓
Study Workspace  —  Summary · 60s Summary · Flashcards · Quiz
        ↓
Quiz Submission  —  deterministic scoring, per-concept diagnostics
        ↓
Performance Update  —  topic mastery moves
        ↓
Academic State UPDATED  →  new Next Best Action
```

### Design Principles

| Principle | Implementation |
| :--- | :--- |
| **Zero-Crash Resilience** | Runs with or without external API keys; heuristic fallback engine activates automatically. |
| **Single Source of Truth** | Every data point has exactly one owner (e.g., mastery lives in `Topic`, never duplicated). |
| **AI Boundary Enforcement** | The LLM generates *content* (summaries, flashcards). Every *number* (scores, mastery, priority) is deterministic. |
| **No Setup Wizard** | The topic catalogue grows organically from the student's own notes. |

---

## 3. Key Features

### 3.1 Ingestion & Pre-Processing
- **Multi-Format Upload**: Supports `.pdf`, `.docx`, and `.txt` files with automated text extraction and cleaning.
- **Direct Paste & Editable Preview**: Review and tweak raw text before AI generation.
- **Pre-loaded Test Notes**: Includes sample notes for *Computer Science (Concurrency)*, *Biology (Cellular Respiration)*, and *Machine Learning (Optimization)* for instant evaluation.

### 3.2 AI Synthesis Engine
- **60-Second Revision**: High-yield elevator pitch with core idea, key takeaways, and a memorable punchline.
- **Detailed Structured Summary**: Sectioned markdown guide with core mechanisms and exam tips.
- **AI Memory Hooks**: Mnemonics, real-world analogies, and concrete examples to anchor complex ideas.
- **Audio Narration (TTS)**: Built-in voice playback using Web Speech API.
- **Staged AI Visualizer**: Animated processing indicator showing real stages (*Reading Notes → Understanding → Creating Cards → Building Quiz → Ready*).

### 3.3 Active Recall Flashcards
- **Interactive 3D Deck**: Realistic 3D card flips with CSS perspective transforms.
- **Spaced Repetition Mastery**: Cards rated as `Easy`, `Medium`, or `Hard` with keyboard shortcuts.
- **Deck Controls**: Shuffle, track card progress, and keyboard-driven navigation.

### 3.4 Diagnostic Quiz & Exam Mode
- **Multiple-Choice Questions**: Tests conceptual understanding with plausible distractors and explanations.
- **Exam Mode**: Integrated countdown timer for simulated test conditions.
- **Question Palette**: Quick navigation and answer tracking across questions.
- **Celebratory Feedback**: Confetti animation on high performance.

### 3.5 Smart Weakness Map & Revise Again Loop
- **Automated Diagnostic**: Detects which specific concepts caused incorrect answers.
- **Visual Mastery Nodes**: Categorises topics as `Mastered`, `Improving`, or `Needs Review`.
- **1-Click Revise Again**: Generates a targeted mini-quiz and flashcards exclusively for weak concepts.

### 3.6 Ask My Notes (RAG-Grounded Q&A)
- Interactive question-answering strictly grounded in the student's uploaded notes.
- Highlights exact verbatim citations and source excerpts to eliminate hallucinations.

### 3.7 Academic OS — Next Best Action Engine
- **Deterministic Priority Engine**: 5-factor scoring system (Weakness, Deadline Urgency, Goal Relevance, Recent Failure, Time Fit) with a 0–50 scale.
- **Time-Fitted Study Plans**: Session plans dynamically adapted to available study time and topic mastery level.
- **Explainable Recommendations**: Templated, human-readable reasoning for each recommendation.
- **Academic State Management**: CRUD for subjects, topics, goals, deadlines, tasks, and external assessments.

### 3.8 Dashboard & Progress Analytics
- Study streak tracking, total kits generated, quiz history.
- Long-term mastery index derived from `Topic` and `Quiz` documents.
- Upcoming deadlines, active goals, and Next Best Action panel.

---

## 4. Technologies Used

### Backend Stack

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | v18+ | Server-side JavaScript runtime |
| **Express.js** | ^4.19.2 | REST API framework, middleware pipeline, route management |
| **MongoDB** | — | NoSQL document database for flexible schema storage |
| **Mongoose** | ^9.9.5 | MongoDB ODM for schema definition, validation, and indexing |
| **JSON Web Tokens (JWT)** | ^9.0.2 | Stateless authentication with 7-day expiry tokens |
| **bcryptjs** | ^2.4.3 | Password hashing (10 salt rounds) |
| **Multer** | ^1.4.5-lts.1 | Multipart form-data parsing for file uploads (10 MB limit) |
| **pdf-parse** | ^1.1.1 | PDF text extraction |
| **mammoth** | ^1.8.0 | DOCX to raw text conversion |
| **uuid** | ^9.0.1 | Collision-resistant unique ID generation |
| **dotenv** | ^16.4.5 | Environment variable management |
| **Google Gemini API** | 1.5-flash / 2.0-flash / 1.5-pro | LLM for content generation (summaries, flashcards, quizzes) |

### Frontend Stack

| Technology | Purpose |
| :--- | :--- |
| **React 18** | Component-based UI framework |
| **Vite** | Build tool and development server |
| **Tailwind CSS** | Utility-first CSS framework |
| **Lucide React** | Icon library |
| **Canvas Confetti** | Celebratory animations |
| **Web Speech API** | Browser-native text-to-speech narration |

### Development & Tooling

| Tool | Purpose |
| :--- | :--- |
| **ES Modules** | Native ESM (`"type": "module"`) throughout backend |
| **Node --watch** | Built-in file watching for development hot-reload |
| **CORS** | Cross-origin resource sharing with permissive development config |

---

## 5. Implementation Details

### 5.1 System Architecture

Pocket Mentor follows a **monolithic full-stack architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React + Vite)                     │
│                    Port: 5173                                │
└─────────────────────────┬───────────────────────────────────┘
                          │  REST API (JSON over HTTP)
┌─────────────────────────▼───────────────────────────────────┐
│                 SERVER (Express.js)                           │
│                 Port: 5001                                    │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐               │
│  │  Routes   │  │Middleware│  │   Config      │               │
│  │  (7 files)│  │  (auth)  │  │  (env, db)    │               │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘               │
│       │              │               │                        │
│  ┌────▼──────────────▼───────────────▼───────┐               │
│  │              Services Layer                │               │
│  │  aiService · dbStore · studyKitService     │               │
│  │  recommendationService · performanceService│               │
│  │  topicResolver · extractionService         │               │
│  └────────────────────┬──────────────────────┘               │
│                       │                                       │
│  ┌────────────────────▼──────────────────────┐               │
│  │           Models Layer (Mongoose)          │               │
│  │  User · Note · StudyKit · Flashcard · Quiz │               │
│  │  Topic · Subject · Goal · Deadline · Task  │               │
│  │  Recommendation · StudyLog · Assessment    │               │
│  └────────────────────┬──────────────────────┘               │
│                       │                                       │
└───────────────────────┼───────────────────────────────────────┘
                        │
              ┌─────────▼─────────┐
              │     MongoDB       │
              │   pocketmentor    │
              └───────────────────┘
```

**Key Architectural Decision**: One Express app, one MongoDB connection, one port. The original learning engine (notes → summary → flashcards → quiz) and the academic layer (priority → Next Best Action) run in the same process and share the same database.

### 5.2 Backend Architecture

#### Directory Structure

```
server/
├── .env                          # Environment configuration
├── .env.example                  # Template for environment variables
├── package.json                  # Dependencies and scripts
└── src/
    ├── server.js                 # Application entry point
    ├── config/
    │   ├── index.js              # Centralised configuration loader
    │   └── db.js                 # MongoDB connection manager
    ├── middleware/
    │   └── auth.js               # JWT authentication middleware
    ├── models/                   # Mongoose schema definitions
    │   ├── User.js               # Student account + academic profile
    │   ├── Note.js               # Uploaded/pasted note documents
    │   ├── StudyKit.js           # Generated study session bundles
    │   ├── Flashcard.js          # Individual flashcards
    │   ├── Quiz.js               # Quiz state (questions, grading, results)
    │   ├── Topic.js              # Source of truth for topic mastery
    │   ├── Subject.js            # Subject groupings
    │   ├── Goal.js               # Academic learning goals
    │   ├── Deadline.js           # Exam/assignment deadlines
    │   ├── Task.js               # Revision to-do items
    │   ├── Recommendation.js     # Persisted Next Best Action decisions
    │   ├── StudyLog.js           # Time tracking for study sessions
    │   └── Assessment.js         # External/offline assessment scores
    ├── routes/                   # Express route handlers
    │   ├── auth.js               # Register, login, guest, profile
    │   ├── notes.js              # Upload, paste, list, delete notes
    │   ├── study.js              # Generate study kit, retrieve sessions, Ask My Notes
    │   ├── quiz.js               # Submit quiz, revise again
    │   ├── progress.js           # Progress analytics, dashboard
    │   ├── recommendations.js    # Next Best Action lifecycle
    │   └── academic.js           # Profile, subjects, topics, goals, deadlines, tasks, assessments
    ├── services/                 # Business logic layer
    │   ├── aiService.js          # Gemini API integration + heuristic fallback
    │   ├── dbStore.js            # Data access layer (Mongoose)
    │   ├── extractionService.js  # PDF/DOCX/TXT text extraction
    │   ├── studyKitService.js    # Unified study kit generator
    │   ├── recommendationService.js  # Next Best Action engine
    │   ├── performanceService.js # Topic mastery update (EMA)
    │   └── topicResolver.js      # Concept string → Topic document resolution
    ├── utils/                    # Pure utility functions
    │   ├── priorityCalculator.js # 5-factor priority scoring engine
    │   ├── dates.js              # Date arithmetic helpers
    │   ├── ids.js                # Prefixed UUID generator
    │   └── text.js               # Text normalisation, clamping, rounding
    └── scripts/
        └── cleanDatabase.js      # Database cleanup utility
```

#### Service Layer Design

The backend follows a layered architecture with clear separation:

- **Routes** handle HTTP concerns (request validation, response formatting, status codes).
- **Services** contain all business logic and are framework-agnostic.
- **Models** define data shapes, validation rules, and indexing strategies.
- **Utils** are pure functions with no side effects or external dependencies.

### 5.3 Database Schema Design

The application uses **13 Mongoose models** with string-based `_id` fields (prefixed UUIDs like `usr_`, `note_`, `kit_`, `quiz_`, etc.) for readability and backwards compatibility.

#### Entity Relationship Overview

```
User (1) ──────▶ (N) Note
  │                    │
  │                    ▼
  ├──────────▶ (N) StudyKit ◀──── Recommendation
  │                 │    │
  │                 ▼    ▼
  │           Flashcard  Quiz ──▶ Topic (mastery updates)
  │                                 │
  ├──────────▶ (N) Subject ◀────────┘
  │
  ├──────────▶ (N) Goal
  ├──────────▶ (N) Deadline
  ├──────────▶ (N) Task
  ├──────────▶ (N) StudyLog
  └──────────▶ (N) Assessment
```

#### Core Models

**User**: Extended beyond basic authentication to include an academic profile (`college`, `course`, `year`, `dailyStudyMinutes`, `preferredStudyStart/End`). The `dailyStudyMinutes` field directly drives the `timeFit` factor in the priority engine.

**Topic** (Source of Truth for Mastery): Stores both raw event counters (`attempts`, `correct`) and a recency-weighted exponential moving average (`masteryScore`, 0–10). New topics default to mastery 5 (unknown, not failing). The mastery label (`Mastered`, `Improving`, `Needs Review`) is derived via a method, never stored.

**Recommendation**: Persists the full snapshot of a Next Best Action decision, including the priority factors at generation time, so the "Why this recommendation?" question can be answered truthfully even after the academic state has moved on.

#### Data Ownership Rules

| Data | Owner | Notes |
| :--- | :--- | :--- |
| Topic mastery | `Topic.masteryScore` | Label is derived from it |
| Quiz results | `Quiz` | Grading is deterministic |
| Per-topic score history | **Derived** from `Quiz.gradedQuestions` | Never stored separately |
| Study kit | `StudyKit` | Formerly called `studySessions` |
| Time studied | `StudyLog` | |
| Weakness / priority | **Derived** | Never stored; recomputed live |
| Progress payload | **Derived** from `Topic` + `Quiz` + `User` | |

### 5.4 AI Integration Layer

#### Dual-Mode Architecture

The AI service (`aiService.js`) implements a resilient dual-mode architecture:

```
Request  ──▶  Gemini API Available?
                    │
              ┌─────┴─────┐
              ▼            ▼
         Yes: Call    No: Heuristic
         Gemini API   NLP Engine
              │            │
              └─────┬──────┘
                    ▼
              Return Study Kit
```

**Mode 1 — Gemini API** (when API keys are configured):
- Supports multiple API keys with automatic key rotation on quota exhaustion.
- Supports a model fallback cascade (e.g., `gemini-1.5-flash` → `gemini-2.0-flash` → `gemini-1.5-pro`).
- Requests JSON output directly via `responseMimeType: 'application/json'`.
- Temperature set to `0.2` for deterministic, factual output.

**Mode 2 — Heuristic NLP Engine** (offline fallback):
- Algorithmic text analysis: sentence segmentation, capital-word frequency analysis, definition pattern matching (`term: description`).
- Generates complete study kits (summary, 60-second summary, flashcards, quiz questions) entirely from text analysis without any external API call.
- Guarantees the application never crashes due to missing or exhausted API keys.

#### Three AI Entry Points

| Function | Purpose | Prompt Strategy |
| :--- | :--- | :--- |
| `generateStudyKit()` | Full study kit from notes | Structured prompt requesting JSON with summary, 60s summary, key concepts, memory hooks, flashcards, and quiz questions |
| `generateReviseAgainKit()` | Targeted revision for weak concepts | Focused prompt listing specific weak concepts, requesting a remediation kit |
| `askMyNotes()` | Source-grounded Q&A | RAG-style prompt with strict instructions to quote source excerpts and flag when answers are not in notes |

#### AI Boundary Enforcement

A critical design decision: the LLM is never asked to produce a number that the system relies on for decision-making.

| Deterministic (never AI) | AI-generated |
| :--- | :--- |
| Quiz score, accuracy | Detailed summary |
| Per-concept diagnostics | 60-second summary |
| Topic mastery (EMA, α = 0.4) | Flashcards |
| All five priority factors | Quiz questions & explanations |
| Priority score & ranking | Memory hooks |
| Time-fitted study plan | Ask My Notes answers |

### 5.5 Priority Engine & Recommendation System

#### Five-Factor Priority Scoring

The priority engine is entirely deterministic and computes a score from 0–50 as a flat sum of five equally-weighted factors:

```
Priority Score = Weakness + Deadline Urgency + Goal Relevance
               + Recent Failure + Time Fit          (each 0–10)
```

**Factor 1 — Weakness (0–10)**:
```
weakness = 10 − masteryScore
```
A topic at mastery 3 scores weakness 7; a topic at mastery 9 scores weakness 1.

**Factor 2 — Recent Failure (0–10)**:
Composed of two sub-components:
- **Severity** (0–6): How badly the student failed the latest assessment, scaled linearly from a "shaky threshold" of 65%.
- **Repetition** (0–4): 2 points per *consecutive* failure (capped at 2), counting back from the latest attempt. One genuine pass resets the penalty — this is what makes the adaptive loop visible.

**Factor 3 — Deadline Urgency (0–10)**:
Only deadlines *relevant* to the topic count (matched by subject, goal, or tag overlap). Day-based urgency bands:

| Days Until Deadline | Score |
| :--- | :--- |
| ≤ 0 (overdue) | 10 |
| 1 | 9 |
| ≤ 3 | 8 |
| ≤ 7 | 6 |
| ≤ 14 | 4 |
| ≤ 30 | 2 |
| > 30 | 1 |

**Factor 4 — Goal Relevance (0–10)**:
Matches active goals to topics via subject association (10 points) or tag overlap (6 points), scaled by goal priority (`high: 1.0`, `medium: 0.8`, `low: 0.6`).

**Factor 5 — Time Fit (0–10)**:
Required session time is derived from mastery:

| Mastery Band | Required Minutes |
| :--- | :--- |
| ≤ 3 (foundational) | 90 min |
| ≤ 6 (developing) | 60 min |
| > 6 (consolidating) | 30 min |

If available time ≥ required → 10; if ≥ 66% → 7; if ≥ 30 min → 4; otherwise → 1.

#### Tie-Breaking

Deterministic tie-breaking ensures the same state always produces the same recommendation:
1. Priority score (descending)
2. Weakness score (descending)
3. Least recently practised first
4. Name alphabetically

#### Time-Fitted Study Plan Generation

The plan split varies by mastery band:

| Mastery | Learn | Practice | Review | Example (90 min) |
| :--- | :--- | :--- | :--- | :--- |
| Foundational (≤ 3) | 50% | 33% | 17% | 45 / 30 / 15 |
| Developing (≤ 6) | 33% | 50% | 17% | 30 / 45 / 15 |
| Consolidating (> 6) | 15% | 60% | 25% | — |

Blocks shorter than 10 minutes are dropped and their time redistributed to the largest surviving block, preventing fragmented sessions.

#### Mastery Update Formula

Topic mastery uses an exponential moving average with α = 0.4:

```
target     = accuracy / 10                    (0–100%  →  0–10)
newMastery = (1 − α) × oldMastery + α × target
```

α = 0.4 is responsive enough that one quiz visibly moves the needle but damped enough that a single lucky result does not declare mastery.

### 5.6 Authentication & Security

- **JWT-based stateless authentication** with 7-day token expiry.
- **Password hashing** via `bcryptjs` with 10 salt rounds.
- **Password field protection**: `passwordHash` is `select: false` in the Mongoose schema, excluded from all queries unless explicitly requested.
- **Per-user data isolation**: Every database query is scoped by `userId`. A document that exists but belongs to another user returns `404` (not `403`), so the API never confirms whether another user's ID exists.
- **Guest login**: One-click demo access via a pre-provisioned guest account (`scholar@pocketmentor.ai`).
- **File upload limits**: Multer configured with a 10 MB file size limit and in-memory storage.
- **JSON payload limit**: Express configured with a 15 MB JSON body limit for large note text.

### 5.7 REST API Reference

#### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new student account | No |
| `POST` | `/api/auth/login` | Log in with email and password | No |
| `POST` | `/api/auth/guest` | Instant 1-click guest login | No |
| `GET` | `/api/auth/me` | Fetch authenticated student profile | Yes |
| `POST` | `/api/auth/logout` | Log out (client-side token removal) | No |

#### Notes (`/api/notes`)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/notes/upload` | Upload and extract text from PDF, DOCX, or TXT | Yes |
| `POST` | `/api/notes/paste` | Save directly pasted note text | Yes |
| `GET` | `/api/notes` | List all notes for the authenticated user | Yes |
| `GET` | `/api/notes/:id` | Retrieve a specific note | Yes |
| `DELETE` | `/api/notes/:id` | Delete a note | Yes |

#### Study (`/api/study`)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/study/generate` | Generate a complete study kit (summary, 60s summary, flashcards, quiz) | Yes |
| `GET` | `/api/study/:sessionId` | Retrieve an active study session with all components | Yes |
| `POST` | `/api/study/:sessionId/ask` | Ask My Notes — source-grounded Q&A with citations | Yes |
| `POST` | `/api/study/flashcards/:id/rate` | Save spaced-repetition card mastery rating | Yes |

#### Quiz (`/api/quiz`)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/quiz/:id/submit` | Submit answers, calculate score, diagnose weak concepts, update topic mastery | Yes |
| `POST` | `/api/quiz/:id/revise` | Generate targeted Revise Again reinforcement drill from weak concepts | Yes |

#### Progress & Dashboard

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/progress` | Long-term mastery index and quiz history (derived from Topic + Quiz) | Yes |
| `GET` | `/api/dashboard` | Dashboard metrics: streak, kits, scores, weak/improving/mastered topics, Next Best Action, deadlines, goals | Yes |

#### Recommendations (`/api/recommendations`)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/recommendations/next` | Get or auto-generate the current Next Best Action | Yes |
| `POST` | `/api/recommendations/generate` | Force a fresh run of the priority engine | Yes |
| `GET` | `/api/recommendations` | Recommendation history (newest first) | Yes |
| `POST` | `/api/recommendations/:id/start` | Start a study session from a recommendation (generates kit from source notes) | Yes |
| `PUT` | `/api/recommendations/:id/complete` | Mark a recommendation as completed | Yes |
| `PUT` | `/api/recommendations/:id/skip` | Skip a recommendation (releases reserved study time) | Yes |

#### Academic State (`/api/academic`)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/academic/profile` | Get academic profile (includes `dailyStudyMinutes`) | Yes |
| `PUT` | `/api/academic/profile` | Update academic profile | Yes |
| `GET` | `/api/academic/subjects` | List all subjects | Yes |
| `POST` | `/api/academic/subjects` | Create a new subject | Yes |
| `GET` | `/api/academic/topics` | List topics (optional `?weak=true` filter) | Yes |
| `POST` | `/api/academic/topics` | Create a topic manually | Yes |
| `PUT` | `/api/academic/topics/:id` | Update a topic (mastery, tags) | Yes |
| `GET` | `/api/academic/goals` | List goals (optional `?status=active` filter) | Yes |
| `POST` | `/api/academic/goals` | Create a learning goal | Yes |
| `PUT` | `/api/academic/goals/:id` | Update a goal | Yes |
| `DELETE` | `/api/academic/goals/:id` | Delete a goal | Yes |
| `GET` | `/api/academic/deadlines` | List deadlines with computed `daysRemaining` | Yes |
| `POST` | `/api/academic/deadlines` | Create a deadline | Yes |
| `PUT` | `/api/academic/deadlines/:id` | Update a deadline | Yes |
| `DELETE` | `/api/academic/deadlines/:id` | Delete a deadline | Yes |
| `GET` | `/api/academic/tasks` | List revision tasks | Yes |
| `POST` | `/api/academic/tasks` | Create a manual task | Yes |
| `PUT` | `/api/academic/tasks/:id` | Update a task (e.g., mark completed) | Yes |
| `DELETE` | `/api/academic/tasks/:id` | Delete a task | Yes |
| `GET` | `/api/academic/assessments` | List external assessment scores | Yes |
| `POST` | `/api/academic/assessments` | Record an external assessment (updates topic mastery) | Yes |

#### Health Check

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Server health check with uptime and timestamp | No |

### 5.8 Data Flow & Closed Learning Loop

#### Flow 1: Notes → Study Kit (Original Learning Engine)

```
1. Student uploads PDF/DOCX/TXT or pastes text
   └── POST /api/notes/upload  or  POST /api/notes/paste
       └── extractionService.extractText()  →  clean text stored in Note

2. Student triggers study kit generation
   └── POST /api/study/generate
       └── studyKitService.generateStudyKit()
           ├── aiService.generateStudyKit()  or  heuristic fallback
           │   └── Returns: summary, 60s summary, key concepts,
           │                memory hooks, flashcards, quiz questions
           ├── Creates Flashcard documents
           ├── Creates Quiz document
           ├── Resolves Subject via topicResolver
           └── Creates StudyKit document

3. Student retrieves session with all components
   └── GET /api/study/:sessionId
       └── Returns: session + note + flashcards + quiz (answers hidden)
```

#### Flow 2: Quiz Submission → Mastery Update → Academic State

```
1. Student submits quiz answers
   └── POST /api/quiz/:id/submit
       ├── Deterministic grading (no AI)
       ├── Per-concept diagnostic aggregation
       ├── topicResolver.resolveTopics() → creates Topics on first sight
       ├── performanceService.applyQuizToTopics()
       │   └── EMA mastery update: newMastery = 0.6 × old + 0.4 × (accuracy/10)
       ├── Links topic IDs to StudyKit and Note documents
       └── Closes recommendation loop if kit came from Next Best Action

2. Student requests revision of weak concepts
   └── POST /api/quiz/:id/revise
       └── aiService.generateReviseAgainKit() → targeted flashcards + quiz
```

#### Flow 3: Next Best Action → Study Session

```
1. Dashboard requests recommendation
   └── GET /api/recommendations/next
       └── generateRecommendation()
           ├── loadAcademicState() → parallel fetch of topics, goals, deadlines, logs
           ├── buildTopicScoreHistory() → derived from Quiz.gradedQuestions
           ├── rankTopics() → 5-factor scoring of ALL topics
           ├── buildPlan() → time-fitted session plan
           ├── findSourceNoteForTopic() → locates notes for the topic
           ├── buildReasoning() → templated, human-readable explanation
           ├── Supersedes old pending recommendations (releases reserved time)
           └── Creates Recommendation + Task documents

2. Student starts the recommended session
   └── POST /api/recommendations/:id/start
       ├── Finds source note for the topic
       ├── Calls THE SAME studyKitService.generateStudyKit()
       ├── Creates StudyLog entry (planned time)
       └── Returns full study workspace (session + flashcards + quiz)
```

#### The Topic Identity Bridge

The join between the two halves of Pocket Mentor is **topic identity**. The `topicResolver` service deterministically resolves the AI-extracted concept strings (e.g., "Mutual Exclusion", "Hold and Wait") to `Topic` documents:

1. Normalise the name to a key (lowercase, trimmed, collapsed whitespace).
2. Look up by `nameKey` or within `aliases`.
3. If found, remember the new spelling variant as an alias.
4. If not found, create a new `Topic` with mastery 5 (neutral).

This means a student's topic catalogue **grows out of their own notes** — import notes, take a quiz, and the priority engine has something to reason about. No setup wizard is needed.

---

## 6. Future Scope

### 6.1 Enhanced Learning Analytics
- **Spaced Repetition Scheduling**: Implement an SM-2 or FSRS algorithm to schedule flashcard reviews at optimal intervals based on individual card difficulty and review history.
- **Forgetting Curve Visualisation**: Display predicted retention decay for each topic, showing students when they are likely to forget material.
- **Learning Velocity Tracking**: Measure and visualise how quickly a student improves on specific topics over time.

### 6.2 Collaborative Features
- **Study Groups**: Enable students to share study kits, compare mastery scores, and collaboratively quiz each other.
- **Instructor Dashboard**: Allow educators to upload lecture notes for an entire class, view aggregated class-wide weak topics, and create targeted interventions.
- **Peer Note Sharing**: Community marketplace for high-quality, peer-reviewed notes.

### 6.3 Advanced AI Capabilities
- **Multimodal Input**: Support image-based notes (handwritten), diagrams, and lecture video transcription as input sources.
- **Adaptive Difficulty**: Dynamically adjust quiz difficulty based on real-time performance within a session.
- **AI Tutor Chat**: Extended conversational tutoring that guides students through problem-solving, not just Q&A.
- **Cross-Note Knowledge Graph**: Build a visual knowledge graph connecting concepts across multiple notes and subjects.

### 6.4 Platform & Integration
- **Mobile Application**: Native iOS/Android app with offline study capability and push notification reminders.
- **LMS Integration**: Plug-ins for Canvas, Moodle, and Google Classroom to auto-import course materials.
- **Calendar Sync**: Integration with Google Calendar and Apple Calendar for deadline management and study session scheduling.
- **Export Capabilities**: Export flashcards to Anki format, summaries to Notion, and progress reports to PDF.

### 6.5 Gamification & Engagement
- **Achievement System**: Badges, milestones, and rewards for consistent study habits and mastery gains.
- **Leaderboards**: Optional competitive rankings within study groups or classes.
- **Streak Mechanics**: Enhanced streak tracking with streak freeze tokens and recovery mechanisms.

### 6.6 Infrastructure & Scalability
- **Multi-Tenancy**: Support for institutional deployments with organisation-level administration.
- **Caching Layer**: Redis-based caching for frequently accessed progress data and recommendation results.
- **Rate Limiting**: Server-side rate limiting for API abuse prevention.
- **Horizontal Scaling**: Containerised deployment with Docker and orchestration with Kubernetes.
- **Timezone Support**: Per-user timezone awareness (currently uses server-local day boundaries).

### 6.7 Known Limitations to Address
- **Concurrent Quiz Submissions**: Read-modify-write on topic mastery can lose updates under concurrent submissions. Solution: atomic `$inc` operations or optimistic concurrency control.
- **Assessment Editing**: Editing an assessment does not retroactively rewind mastery. Solution: maintain a full audit trail and recompute mastery from history on edit.
- **Topic Granularity**: AI-extracted topic granularity follows note formatting, which can produce coarse or oddly-named topics. Solution: topic merging/splitting UI and NLP-based topic deduplication.

---

## 7. References / Bibliography

### Academic Research & Learning Science

1. Roediger, H. L., & Butler, A. C. (2011). *The Critical Role of Retrieval Practice in Long-Term Retention*. Trends in Cognitive Sciences, 15(1), 20–27.
   — Foundational research on active recall as a learning strategy, informing the flashcard and quiz design.

2. Karpicke, J. D., & Blunt, J. R. (2011). *Retrieval Practice Produces More Learning than Elaborative Studying with Concept Mapping*. Science, 331(6018), 772–775.
   — Evidence that self-testing outperforms passive study methods.

3. Ebbinghaus, H. (1885). *Über das Gedächtnis* (On Memory). Leipzig: Duncker & Humblot.
   — Original research on the forgetting curve and spaced repetition.

4. Leitner, S. (1972). *So lernt man lernen* (Learning to Learn). Freiburg: Herder.
   — The Leitner system for spaced repetition flashcards, influencing the card difficulty rating system.

5. Dunlosky, J., et al. (2013). *Improving Students' Learning With Effective Learning Techniques*. Psychological Science in the Public Interest, 14(1), 4–58.
   — Comprehensive meta-analysis ranking study strategies by effectiveness.

### Technology Documentation

6. Google. (2024). *Gemini API Documentation*. https://ai.google.dev/docs
   — Official documentation for the Gemini generative AI models used in content generation.

7. Express.js. (2024). *Express 4.x API Reference*. https://expressjs.com/en/4x/api.html
   — Framework documentation for the backend HTTP server.

8. Mongoose. (2024). *Mongoose v9.x Documentation*. https://mongoosejs.com/docs/guide.html
   — ODM documentation for schema definition, validation, and query building.

9. MongoDB. (2024). *MongoDB Manual*. https://www.mongodb.com/docs/manual/
   — Database engine documentation.

10. Auth0. (2024). *Introduction to JSON Web Tokens*. https://jwt.io/introduction
    — Reference for JWT-based authentication implementation.

11. Node.js. (2024). *Node.js v18 Documentation*. https://nodejs.org/docs/latest-v18.x/api/
    — Runtime documentation including ES modules and the `--watch` flag.

12. Vite. (2024). *Vite Documentation*. https://vitejs.dev/guide/
    — Build tool and development server documentation.

13. React. (2024). *React 18 Documentation*. https://react.dev/
    — Frontend framework documentation.

### Libraries & Tools

14. `pdf-parse` — https://www.npmjs.com/package/pdf-parse — PDF text extraction.
15. `mammoth` — https://www.npmjs.com/package/mammoth — DOCX to text conversion.
16. `bcryptjs` — https://www.npmjs.com/package/bcryptjs — Password hashing.
17. `jsonwebtoken` — https://www.npmjs.com/package/jsonwebtoken — JWT token generation and verification.
18. `multer` — https://www.npmjs.com/package/multer — Multipart file upload middleware.
19. `canvas-confetti` — https://www.npmjs.com/package/canvas-confetti — Celebratory animation effects.
20. `Lucide React` — https://lucide.dev/ — Open-source icon library.

---

*Document generated for Pocket Mentor v1.0.0 — September 2026*
