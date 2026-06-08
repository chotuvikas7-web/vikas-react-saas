import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signUser(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '8h' });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Authentication required.' });
  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired session.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Permission denied.' });
    }
    next();
  };
}
