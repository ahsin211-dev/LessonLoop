const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json',
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

function ok(body) {
  return json(200, body);
}

function created(body) {
  return json(201, body);
}

function badRequest(message, details) {
  return json(400, { error: message, details });
}

function notFound(message) {
  return json(404, { error: message });
}

function serverError(message) {
  return json(500, { error: message });
}

function parseBody(event) {
  if (!event.body) return {};
  try {
    return typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch {
    throw new Error('Invalid JSON body');
  }
}

module.exports = {
  json,
  ok,
  created,
  badRequest,
  notFound,
  serverError,
  parseBody,
  CORS_HEADERS,
};
