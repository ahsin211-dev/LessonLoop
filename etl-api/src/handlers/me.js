const { authenticate } = require('../lib/auth');
const { ok, json } = require('../lib/response');

exports.handler = async (event) => {
  const user = authenticate(event);
  if (!user) {
    return json(401, { error: 'Unauthorized' });
  }
  return ok({ teacher: user });
};
