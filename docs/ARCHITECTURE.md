# LessonLoop Architecture

## System Overview

```
┌─────────────┐     HTTP      ┌──────────────────┐     ┌─────────────────┐
│   website   │ ────────────► │    etl-api       │ ──► │ DynamoDB Local  │
│  Nuxt/Vue   │               │ Serverless/Node  │     │  (production:   │
│  PrimeVue   │ ◄──────────── │                  │     │   DynamoDB)     │
└─────────────┘               └────────┬─────────┘     └─────────────────┘
                                       │
                              ┌────────┴─────────┐
                              │  TEK-Base stub   │
                              │  Bedrock stub    │
                              │  OpenSearch stub │
                              └──────────────────┘
```

## API Endpoints

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/health` | `health.js` | Health check |
| POST | `/surveys/sessions` | `createSurveySession.js` | Create survey session |
| GET | `/surveys/sessions/{sessionId}` | `getSurveySession.js` | Get session for student |
| POST | `/surveys/sessions/{sessionId}/responses` | `submitSurveyResponses.js` | Submit Likert answers |
| POST | `/surveys/sessions/{sessionId}/complete` | `completeSurvey.js` | Score and generate report |
| GET | `/reports/{sessionId}` | `getReport.js` | Get engagement report |
| GET | `/reports/{sessionId}/recommendations` | `getRecommendations.js` | TEK-Base strategies |

## DynamoDB Single-Table Design

Table: `LessonLoop-{stage}`

| PK | SK | Entity |
|----|-----|--------|
| `SESSION#{sessionId}` | `METADATA` | SurveySession |
| `SESSION#{sessionId}` | `RESPONSE#{responseId}` | SurveyResponse |
| `SESSION#{sessionId}` | `REPORT` | EngagementReport |

## Scoring Logic

**File:** `etl-api/src/services/scoring.js`

1. Each answer is a Likert integer 1–5 (Strongly Disagree → Strongly Agree)
2. Reverse-scored items (e.g. `mitigating_factors`) flip: `effective = 6 - raw`
3. Per-subscale score = mean of effective values for that category
4. Overall score = mean of all selected subscale scores
5. Percent = `(score - 1) / 4 * 100`

## Frontend Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `pages/index.vue` | Teacher dashboard — create survey |
| `/survey/[sessionId]` | `pages/survey/[sessionId].vue` | Anonymous student survey |
| `/reports/[sessionId]` | `pages/reports/[sessionId].vue` | Engagement report + recommendations |

## Environment Variables

### etl-api

| Variable | Default | Description |
|----------|---------|-------------|
| `TABLE_NAME` | `LessonLoop-local` | DynamoDB table |
| `DYNAMODB_ENDPOINT` | — | Local endpoint (e.g. `http://localhost:8000`) |
| `BEDROCK_STUB` | `true` | Use local recommendation stub |
| `OPENSEARCH_STUB` | `true` | Use local RBIS stub |

### website

| Variable | Default | Description |
|----------|---------|-------------|
| `NUXT_PUBLIC_API_BASE` | `http://localhost:3001/local` | API base URL |
