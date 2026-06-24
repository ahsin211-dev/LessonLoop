/**
 * Create DynamoDB Local table for development.
 * Run: node scripts/setup-local-tables.js
 */
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const TABLE_NAME = process.env.TABLE_NAME || 'LessonLoop-local';
const ENDPOINT = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';

const client = new DynamoDBClient({
  endpoint: ENDPOINT,
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
  },
});

async function tableExists() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (await tableExists()) {
    console.log(`Table ${TABLE_NAME} already exists`);
    return;
  }

  await client.send(new CreateTableCommand({
    TableName: TABLE_NAME,
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
  }));

  console.log(`Created table ${TABLE_NAME} at ${ENDPOINT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
