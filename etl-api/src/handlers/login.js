const { AUTH_DEV_MODE, signToken } = require('../lib/auth');
const { ok, badRequest, serverError, parseBody, json } = require('../lib/response');

const DEV_TEACHERS = {
  'teacher-demo-001': { email: 'demo@lessonloop.local', name: 'Demo Teacher' },
  'teacher-demo-002': { email: 'coach@lessonloop.local', name: 'Coach Demo' },
};

exports.handler = async (event) => {
  try {
    if (!AUTH_DEV_MODE) {
      return json(403, { error: 'Dev login disabled. Configure SSO/Cognito for production.' });
    }

    const body = parseBody(event);
    const { teacherId, email, name } = body;

    if (!teacherId) {
      return badRequest('teacherId is required');
    }

    const preset = DEV_TEACHERS[teacherId];
    const token = signToken({
      teacherId,
      email: email || preset?.email || `${teacherId}@lessonloop.local`,
      name: name || preset?.name || 'Teacher',
    });

    return ok({
      token,
      teacher: {
        teacherId,
        email: email || preset?.email || `${teacherId}@lessonloop.local`,
        name: name || preset?.name || 'Teacher',
      },
      expiresIn: '24h',
      note: 'Dev auth only. Production should use Cognito/OIDC SSO.',
    });
  } catch (err) {
    console.error('login error', err.message);
    return serverError(err.message);
  }
};
