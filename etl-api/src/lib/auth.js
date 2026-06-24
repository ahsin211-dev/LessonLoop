const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lessonloop-dev-secret-change-in-production';
const AUTH_DEV_MODE = process.env.AUTH_DEV_MODE !== 'false';

class AuthError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

function signToken({ teacherId, email, name }) {
  return jwt.sign(
    { sub: teacherId, email, name, role: 'teacher' },
    JWT_SECRET,
    { expiresIn: '24h' },
  );
}

function verifyTokenString(token) {
  return jwt.verify(token, JWT_SECRET);
}

function getBearerToken(event) {
  const auth = event.headers?.Authorization || event.headers?.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

function authenticate(event) {
  const token = getBearerToken(event);
  if (!token) return null;
  try {
    const decoded = verifyTokenString(token);
    return {
      teacherId: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || 'teacher',
    };
  } catch {
    return null;
  }
}

function requireAuth(event) {
  const user = authenticate(event);
  if (!user) throw new AuthError('Unauthorized — valid Bearer token required');
  return user;
}

function requireSessionOwner(event, session) {
  const user = requireAuth(event);
  if (session.teacherId !== user.teacherId) {
    throw new AuthError('Forbidden — you do not own this session', 403);
  }
  return user;
}

module.exports = {
  AuthError,
  AUTH_DEV_MODE,
  signToken,
  verifyTokenString,
  getBearerToken,
  authenticate,
  requireAuth,
  requireSessionOwner,
};
