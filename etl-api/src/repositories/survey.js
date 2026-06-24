const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.TABLE_NAME || 'LessonLoop-local';

const clientConfig = {};
if (process.env.DYNAMODB_ENDPOINT) {
  clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
  clientConfig.region = process.env.AWS_REGION || 'us-east-1';
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
  };
}

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient(clientConfig), {
  marshallOptions: { removeUndefinedValues: true },
});

const KEYS = {
  session: (sessionId) => ({ PK: `SESSION#${sessionId}`, SK: 'METADATA' }),
  response: (sessionId, responseId) => ({ PK: `SESSION#${sessionId}`, SK: `RESPONSE#${responseId}` }),
  report: (sessionId) => ({ PK: `SESSION#${sessionId}`, SK: 'REPORT' }),
};

async function createSession(session) {
  const item = {
    ...KEYS.session(session.sessionId),
    entityType: 'SurveySession',
    ...session,
  };
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
    ConditionExpression: 'attribute_not_exists(PK)',
  }));
  return item;
}

async function getSession(sessionId) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: KEYS.session(sessionId),
  }));
  return result.Item || null;
}

async function saveResponse(sessionId, response) {
  const item = {
    ...KEYS.response(sessionId, response.responseId),
    entityType: 'SurveyResponse',
    sessionId,
    ...response,
  };
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

async function listResponses(sessionId) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `SESSION#${sessionId}`,
      ':sk': 'RESPONSE#',
    },
  }));
  return result.Items || [];
}

async function saveReport(sessionId, report) {
  const item = {
    ...KEYS.report(sessionId),
    entityType: 'EngagementReport',
    sessionId,
    ...report,
  };
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

async function getReport(sessionId) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: KEYS.report(sessionId),
  }));
  return result.Item || null;
}

async function markSessionComplete(sessionId) {
  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: KEYS.session(sessionId),
    UpdateExpression: 'SET #status = :status, completedAt = :completedAt',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':status': 'completed',
      ':completedAt': new Date().toISOString(),
    },
  }));
}

module.exports = {
  TABLE_NAME,
  createSession,
  getSession,
  saveResponse,
  listResponses,
  saveReport,
  getReport,
  markSessionComplete,
};
