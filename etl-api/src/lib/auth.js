const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lessonloop-dev-secret-change-in-production';
const AUTH_DEV_MODE = process.env.AUTH_DEV_MODE !== 'false';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

let cognitoVerifier = null;

function getCognitoVerifier() {
  if (!COGNITO_USER_POOL_ID || !COGNITO_CLIENT_ID) return null;
  if (!cognitoVerifier) {
    try {
      const { CognitoJwtVerifier } = require('aws-jwt-verify');
      cognitoVerifier = CognitoJwtVerifier.create({
        userPoolId: COGNITO_USER_POOL_ID,
        tokenUse: 'id',
        clientId: COGNITO_CLIENT_ID,
      });
    } catch (err) {
      console.error('Cognito verifier init failed:', err.message);
      return null;
    }
  }
  return cognitoVerifier;
}

class AuthError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

function signToken({ teacherId, email, name, role = 'teacher' }) {
  return jwt.sign(
    { sub: teacherId, email, name, role },
    JWT_SECRET,
    { expiresIn: '24h' },
  );
}

function verifyDevToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function getBearerToken(event) {
  const auth = event.headers?.Authorization || event.headers?.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

function mapUser(decoded, provider = 'dev') {
  return {
    teacherId: decoded.sub,
    email: decoded.email,
    name: decoded.name || decoded['cognito:username'] || decoded.email,
    role: decoded.role || decoded['custom:role'] || 'teacher',
    authProvider: provider,
  };
}

async function authenticate(event) {
  const token = getBearerToken(event);
  if (!token) return null;

  const verifier = getCognitoVerifier();
  if (verifier) {
    try {
      const decoded = await verifier.verify(token);
      return mapUser(decoded, 'cognito');
    } catch {
      // Fall through to dev JWT when Cognito verification fails
    }
  }

  if (AUTH_DEV_MODE) {
    try {
      const decoded = verifyDevToken(token);
      return mapUser(decoded, 'dev');
    } catch {
      return null;
    }
  }

  return null;
}

function requireAuth(event) {
  return authenticate(event).then((user) => {
    if (!user) throw new AuthError('Unauthorized — valid Bearer token required');
    return user;
  });
}

async function requireSessionOwner(event, session) {
  const user = await requireAuth(event);
  if (session.teacherId !== user.teacherId) {
    throw new AuthError('Forbidden — you do not own this session', 403);
  }
  return user;
}

function requireRole(user, role) {
  if (user.role !== role && user.role !== 'admin') {
    throw new AuthError(`Forbidden — ${role} role required`, 403);
  }
}

module.exports = {
  AuthError,
  AUTH_DEV_MODE,
  COGNITO_USER_POOL_ID,
  signToken,
  verifyDevToken,
  getBearerToken,
  authenticate,
  requireAuth,
  requireSessionOwner,
  requireRole,
};
