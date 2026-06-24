# LessonLoop

AI-powered professional learning platform for Student Engagement Surveys (SES), engagement scoring across nine subscales, and evidence-based instructional strategy recommendations.

## Repositories

| Directory | Description |
|-----------|-------------|
| `etl-api/` | Node.js backend — AWS Lambda (Serverless Framework), DynamoDB, scoring engine |
| `website/` | Vue 3 / Nuxt 3 / PrimeVue frontend — survey submission and engagement reports |
| `docs/` | Technical documentation |

## Stack

- **Frontend:** Vue 3, Nuxt 3, PrimeVue
- **Backend:** Node.js 20, Serverless Framework, serverless-offline
- **Database:** DynamoDB (DynamoDB Local for dev)
- **AI (stubbed locally):** TEK-Base recommendations, Bedrock/OpenSearch stubs

## Quick Start (Docker)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Website | http://localhost:3000 |
| API | http://localhost:3001/local |
| DynamoDB Local | http://localhost:8000 |

### Seed demo data

```bash
cd etl-api
npm install
DYNAMODB_ENDPOINT=http://localhost:8000 TABLE_NAME=LessonLoop-local npm run setup:local
DYNAMODB_ENDPOINT=http://localhost:8000 TABLE_NAME=LessonLoop-local npm run seed
```

Use the printed session ID to open `/reports/{sessionId}`.

## Quick Start (without Docker)

### Backend

```bash
cd etl-api
npm install
# Requires DynamoDB Local on port 8000, or use Docker for dynamodb only:
# docker run -p 8000:8000 amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb -inMemory

export DYNAMODB_ENDPOINT=http://localhost:8000
export TABLE_NAME=LessonLoop-local
export AWS_ACCESS_KEY_ID=local
export AWS_SECRET_ACCESS_KEY=local

npm run setup:local
npm start
```

### Frontend

```bash
cd website
npm install
NUXT_PUBLIC_API_BASE=http://localhost:3001/local npm run dev
```

Open http://localhost:3000

## Survey → Score Flow

1. Teacher creates survey session (`POST /surveys/sessions`)
2. Students complete anonymous Likert survey (`POST /surveys/sessions/{id}/responses`)
3. Teacher completes survey (`POST /surveys/sessions/{id}/complete`) → scoring runs
4. Report displayed (`GET /reports/{id}`) with overall + 9 subscale scores
5. TEK-Base recommendations (`GET /reports/{id}/recommendations`)

## Nine SES Subscales

| Key | Display Name | Group |
|-----|--------------|-------|
| `cognitive` | Cognitive | Learner Experience |
| `social` | Social | Learner Experience |
| `emotional` | Emotional | Learner Experience |
| `self_regulation` | Self-Regulation | Learner Experience |
| `student_agency` | Student Agency | Learner Experience |
| `mitigating_factors` | Mitigating Factors | Learner Experience |
| `lesson_design` | Lesson Design | Instructional Design |
| `content_accessibility` | Content Accessibility | Instructional Design |
| `technology_use` | Technology Use | Instructional Design |

Scoring logic: `etl-api/src/services/scoring.js`

## Tests

```bash
cd etl-api && npm test
```

## Privacy

- Student surveys are anonymous (no student IDs stored)
- Local development uses scrubbed demo data only
- Do not enable debug logging of response content in production

## Documentation

- [Phase 1 Codebase Review](docs/PHASE1_CODEBASE_REVIEW.md)
- [Architecture & Scoring Guide](docs/ARCHITECTURE.md)
