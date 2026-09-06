import { verifyToken } from '../utils/auth.js';

export function requireAuth(expectedType) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication token is required.' });
    }

    try {
      const user = verifyToken(token);
      if (expectedType && user.type !== expectedType) {
        return res.status(403).json({ message: 'You do not have permission to access this resource.' });
      }
      req.auth = user;
      next();
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
  };
}
