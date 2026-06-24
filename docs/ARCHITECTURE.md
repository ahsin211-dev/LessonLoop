# LessonLoop Architecture

## System Overview

```
┌─────────────┐     HTTP+JWT  ┌──────────────────┐     ┌─────────────────┐
│   website   │ ────────────► │    etl-api       │ ──► │ DynamoDB        │
│  Nuxt/Vue   │               │ Serverless/Node  │     │  (GSI1: teacher)│
│  PrimeVue   │ ◄──────────── │                  │     └─────────────────┘
└─────────────┘               └────────┬─────────┘
       │                               │
  /login (teacher)            ┌────────┴─────────┐
  /survey (anonymous)         │  OpenSearch RBIS │
                              │  AWS Bedrock     │
                              └──────────────────┘
```

## Authentication

| Route type | Auth | Mechanism |
|------------|------|-----------|
| Teacher dashboard, reports, complete | Required | `Authorization: Bearer <JWT>` |
| Student survey submit | None | Anonymous `respondentId` UUID |
| Health, login | None | — |

Dev login: `POST /auth/login` with `{ teacherId }` → JWT (24h).

Production path: replace dev login with Cognito/OIDC; verify tokens in `src/lib/auth.js`.

## Multi-Student Scoring

1. Each student device generates a `respondentId` (UUID in sessionStorage)
2. One submission batch per `respondentId` per session
3. Scoring groups responses by `respondentId`:
   - Per student: mean effective score per category
   - Per category: mean across students
   - Overall: mean of category scores

File: `etl-api/src/services/scoring.js` → `computeEngagementScores()`

## Question Bank

- 27 questions in `etl-api/src/constants/questions.js` (3 per category)
- `pickQuestionsForCategories(keys, { questionsPerCategory, seed })`
- Random selection without replacement within each category

## DynamoDB Schema

Table: `LessonLoop-{stage}`

| PK | SK | GSI1PK | GSI1SK | Entity |
|----|-----|--------|--------|--------|
| `SESSION#{id}` | `METADATA` | `TEACHER#{teacherId}` | `SESSION#{createdAt}` | SurveySession |
| `SESSION#{id}` | `RESPONSE#{responseId}` | — | — | SurveyResponse |
| `SESSION#{id}` | `REPORT` | — | — | EngagementReport |

GSI1 enables `listSessionsForTeacher()`.

## AI Integration

### OpenSearch (`src/services/opensearch.js`)
- Index: `rbis-strategies`
- Stub: returns `src/constants/rbis.js` static map
- Production: set `OPENSEARCH_STUB=false` + `OPENSEARCH_ENDPOINT`

### Bedrock (`src/services/bedrock.js`)
- Model: `BEDROCK_MODEL_ID` (default Claude 3.5 Sonnet)
- Stub: templated markdown activity
- Production: set `BEDROCK_STUB=false`

### TEK-Base (`src/services/recommendations.js`)
- Finds subscales below threshold (default 3.5)
- Retrieves RBIS via OpenSearch
- Generates customized activity via Bedrock

## Frontend Routes

| Route | Auth | Purpose |
|-------|------|---------|
| `/login` | — | Teacher dev sign-in |
| `/` | Teacher | Dashboard + session list |
| `/sessions/{id}` | Teacher | Monitor participation, close session |
| `/survey/{id}` | — | Anonymous student survey |
| `/reports/{id}` | Teacher | Engagement report + recommendations |
