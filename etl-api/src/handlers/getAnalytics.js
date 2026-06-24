const { ok } = require('../lib/response');
const { requireAuth } = require('../lib/auth');
const { withHandler } = require('../lib/handler');
const { computeTeacherAnalytics } = require('../services/analytics');

exports.handler = withHandler(async (event) => {
  const user = await requireAuth(event);
  const analytics = await computeTeacherAnalytics(user.teacherId);
  return ok(analytics);
});
