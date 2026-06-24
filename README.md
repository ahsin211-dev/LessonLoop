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
- **Backend:** Node.js 20, Serverless Framework, JWT auth (dev) / Cognito-ready
- **Database:** DynamoDB (DynamoDB Local for dev)
- **AI:** TEK-Base recommendations via OpenSearch RBIS + AWS Bedrock (stubbed locally)

## Quick Start (Docker)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Website | http://localhost:3000 |
| API | http://localhost:3001/local |
| DynamoDB Local | http://localhost:8000 |

### First-time flow

1. Open http://localhost:3000/login — sign in as Demo Teacher
2. Create a survey session (select categories, questions per category)
3. Copy the survey link from the session monitor page
4. Open the link in another browser/incognito as a student
5. Return to dashboard → Close session & generate report

### Seed demo data

```bash
cd etl-api
npm install
DYNAMODB_ENDPOINT=http://localhost:8000 TABLE_NAME=LessonLoop-local npm run setup:local
DYNAMODB_ENDPOINT=http://localhost:8000 TABLE_NAME=LessonLoop-local npm run seed
```

## Quick Start (without Docker)

### Backend

```bash
cd etl-api
npm install
# DynamoDB Local on port 8000 required

export DYNAMODB_ENDPOINT=http://localhost:8000
export TABLE_NAME=LessonLoop-local
export AWS_ACCESS_KEY_ID=local
export AWS_SECRET_ACCESS_KEY=local
export AUTH_DEV_MODE=true

npm run setup:local
npm start
```

### Frontend

```bash
cd website
npm install
NUXT_PUBLIC_API_BASE=http://localhost:3001/local npm run dev
```

## Features

### Teacher authentication
- Dev JWT login at `/login` (`POST /auth/login`)
- Protected routes: dashboard, session monitor, reports
- Student survey remains anonymous (no login)

### Multi-student aggregation
- Each student device gets a unique `respondentId` (stored in sessionStorage)
- One submission per device per survey
- Teacher closes session when ready → scores aggregate per-student then across class
- Report shows `studentCount` and per-subscale student breakdown

### Expanded question bank
- 27 questions (3 per subscale category)
- Random selection with configurable `questionsPerCategory` (1–3)
- Optional `seed` for reproducible question sets

### AI recommendations (TEK-Base)
- OpenSearch RBIS retrieval (`OPENSEARCH_STUB=false` + endpoint for production)
- Bedrock activity generation (`BEDROCK_STUB=false` for production Claude)
- Local stubs return static strategies + templated activities

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | — | Dev teacher login |
| GET | `/auth/me` | Teacher | Current user |
| POST | `/surveys/sessions` | Teacher | Create survey |
| GET | `/surveys/sessions` | Teacher | List teacher sessions |
| GET | `/surveys/sessions/{id}` | — | Get survey (student) |
| GET | `/surveys/sessions/{id}/status` | Teacher | Participation stats |
| POST | `/surveys/sessions/{id}/responses` | — | Submit answers |
| POST | `/surveys/sessions/{id}/complete` | Teacher | Score & close |
| GET | `/reports/{id}` | Teacher | Engagement report |
| GET | `/reports/{id}/recommendations` | Teacher | TEK-Base strategies |

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

Scoring: `etl-api/src/services/scoring.js`

## Tests

```bash
cd etl-api && npm test   # 9 tests
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | dev secret | JWT signing key |
| `AUTH_DEV_MODE` | `true` | Enable dev login |
| `BEDROCK_STUB` | `true` | Use local AI stub |
| `OPENSEARCH_STUB` | `true` | Use local RBIS stub |
| `OPENSEARCH_ENDPOINT` | — | OpenSearch URL (production) |
| `BEDROCK_MODEL_ID` | Claude 3.5 Sonnet | Bedrock model |

## Privacy

- Student surveys are anonymous (no student IDs stored)
- `respondentId` is a random UUID per device — not linked to identity
- Teacher routes require authentication
- Local development uses scrubbed demo data only

## Documentation

- [Architecture & Scoring Guide](docs/ARCHITECTURE.md)
- [Phase 1 Codebase Review](docs/PHASE1_CODEBASE_REVIEW.md)
