import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../services/dbStore.js';
import { config } from '../config/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

function createToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await dbStore.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
      _id: 'usr_' + uuidv4(),
      name,
      email,
      passwordHash,
      streak: 1,
      createdAt: new Date().toISOString()
    };

    await dbStore.createUser(newUser);
    const token = createToken(newUser._id);

    return res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        streak: newUser.streak
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Failed to register user' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await dbStore.getUserByEmailWithPassword(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update streak if needed
    const token = createToken(user._id);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        streak: user.streak || 1
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Failed to log in' });
  }
});

// POST /api/auth/guest (Instant 1-click login for quick demo/review)
router.post('/guest', async (req, res) => {
  try {
    const guestEmail = 'scholar@pocketmentor.ai';
    let user = await dbStore.getUserByEmail(guestEmail);

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('demo12345', salt);
      user = {
        _id: 'usr_guest_scholar',
        name: 'Alex Rivera (Scholar)',
        email: guestEmail,
        passwordHash,
        streak: 3,
        createdAt: new Date().toISOString()
      };
      await dbStore.createUser(user);
    }

    const token = createToken(user._id);
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        streak: user.streak || 3
      }
    });
  } catch (err) {
    console.error('Guest login error:', err);
    return res.status(500).json({ message: 'Guest login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      streak: req.user.streak || 1
    }
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
