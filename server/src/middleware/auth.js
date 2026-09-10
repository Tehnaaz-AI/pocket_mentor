import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { dbStore } from '../services/dbStore.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    
    const user = await dbStore.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found or session expired' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
