const { AuthError } = require('./auth');
const { json, serverError } = require('./response');

/**
 * Wrap a handler with consistent auth error handling.
 */
function withHandler(fn) {
  return async (event) => {
    try {
      return await fn(event);
    } catch (err) {
      if (err instanceof AuthError) {
        return json(err.statusCode, { error: err.message });
      }
      console.error('handler error', err.message);
      return serverError(err.message);
    }
  };
}

module.exports = { withHandler };
