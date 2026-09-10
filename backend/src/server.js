import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';
import { aiService } from './services/aiService.js';

import authRoutes from './routes/auth.js';
import notesRoutes from './routes/notes.js';
import studyRoutes from './routes/study.js';
import quizRoutes from './routes/quiz.js';
import progressRoutes from './routes/progress.js';
// Academic OS layer — merged in, same app, same port, same database.
import recommendationRoutes from './routes/recommendations.js';
import academicRoutes from './routes/academic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Pocket Mentor API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/dashboard', (req, res, next) => {
  // Shortcut redirect to progress dashboard route
  req.url = '/dashboard';
  progressRoutes(req, res, next);
});

// Static Frontend Serving (if built)
const potentialDistPaths = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), 'dist'),
  path.resolve(__dirname, '../public')
];

const staticDistPath = potentialDistPaths.find(p => fs.existsSync(p));

if (staticDistPath) {
  console.log(`📦 Serving static frontend from: ${staticDistPath}`);
  app.use(express.static(staticDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(staticDistPath, 'index.html'));
  });
} else {
  // Root API landing
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Pocket Mentor API',
      message: 'Pocket Mentor API is running. Frontend is available via client dev server or deployed build.',
      health: '/api/health'
    });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

/**
 * One Express app, one MongoDB connection, one port.
 * The original learning engine (notes -> summary -> flashcards -> quiz) and the
 * academic layer (priority -> Next Best Action) run in the same process and
 * share the same database.
 */
const start = async () => {
  await connectDB();
  const PORT = config.port || 5001;
  const HOST = '0.0.0.0';

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Pocket Mentor Backend running on http://${HOST}:${PORT}`);
    const provider = config.aiProvider === 'gemini' ? 'Gemini' : 'Groq';
    const models = config.aiProvider === 'gemini' ? config.geminiModels : config.groqModels;
    if (aiService.hasProvider()) {
      console.log(`✨ AI Provider: ${provider}`);
      console.log(`   AI Model: ${models[0]}${models[1] ? `  (fallback: ${models[1]})` : ''}`);
    } else {
      console.log(`⚠️  AI Provider: ${provider} — NO API KEY CONFIGURED`);
      console.log(`   Falling back to the deterministic heuristic engine.`);
    }
    console.log(`🎯 Academic OS: priority engine + Next Best Action enabled`);
  });
};

start().catch((err) => {
  console.error('\n❌ Failed to start Pocket Mentor:', err.message);
  if (err.message.includes('ECONNREFUSED') || !process.env.MONGODB_URI) {
    console.error('\n💡 Deployment Diagnostic:');
    console.error('   1. If deploying on Render / cloud, configure MONGODB_URI in your environment variables.');
    console.error('   2. Use a cloud MongoDB connection string (e.g., MongoDB Atlas: mongodb+srv://<user>:<password>@cluster.mongodb.net/dbname).');
    console.error('   3. Ensure Network Access in MongoDB Atlas allows 0.0.0.0/0 (all IPs).\n');
  }
  process.exit(1);
});
