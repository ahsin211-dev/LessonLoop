const { ok } = require('../lib/response');

exports.handler = async () => ok({
  status: 'ok',
  service: 'lessonloop-etl-api',
  stage: process.env.STAGE || 'local',
  timestamp: new Date().toISOString(),
});
