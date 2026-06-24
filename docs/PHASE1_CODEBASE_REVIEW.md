# LessonLoop Phase 1 — Codebase Review & Familiarity Task Report

**Date:** 2026-06-24  
**Status:** Complete (built from scratch)

---

## Executive Summary

The original production repositories were unavailable. LessonLoop was **built from scratch** as a working reference implementation matching the described stack and SES scoring requirements.

**Deliverables:**
- `etl-api/` — Serverless Node.js API with DynamoDB, scoring engine, TEK-Base stub
- `website/` — Nuxt 3 / Vue 3 / PrimeVue frontend with survey and report UI
- `docker-compose.yml` — Local development environment
- All 6 backend unit tests passing
- End-to-end API flow verified locally

---

## 1. Local Setup Result

### Repositories

| Repo | Path | Status |
|------|------|--------|
| Backend | `etl-api/` | Built and running |
| Frontend | `website/` | Built (Nuxt 3) |
| Monorepo root | `/` | `docker-compose.yml`, docs |

### Environment Setup

```bash
# Option A: Docker
docker compose up --build

# Option B: Manual (verified on cloud VM)
# Terminal 1: DynamoDB Local
java -jar DynamoDBLocal.jar -sharedDb -inMemory -port 8000

# Terminal 2: API
cd etl-api
npm install && npm run setup:local && npm start

# Terminal 3: Frontend
cd website
npm install && NUXT_PUBLIC_API_BASE=http://localhost:3001/local npm run dev
```

### Services Verified

| Service | URL | Status |
|---------|-----|--------|
| Website | http://localhost:3000 | Built |
| API | http://localhost:3001/local | **Running** — health OK |
| DynamoDB Local | http://localhost:8000 | **Running** |

### Tests

```
cd etl-api && npm test
# 6 tests, 0 failures
```

---

## 2. Survey-to-Score Data Flow

```
Teacher Dashboard (/)
  → POST /surveys/sessions (createSurveySession.js)
  → DynamoDB SESSION#{id}/METADATA

Student Survey (/survey/{sessionId})
  → GET /surveys/sessions/{id} (getSurveySession.js)
  → POST /surveys/sessions/{id}/responses (submitSurveyResponses.js)
  → DynamoDB SESSION#{id}/RESPONSE#{responseId}

Complete & Score
  → POST /surveys/sessions/{id}/complete (completeSurvey.js)
  → scoring.js computeEngagementScores()
  → DynamoDB SESSION#{id}/REPORT

Teacher Report (/reports/{sessionId})
  → GET /reports/{id} (getReport.js)
  → GET /reports/{id}/recommendations (getRecommendations.js)
```

---

## 3. Nine Subscale Mapping

Defined in `etl-api/src/constants/subscales.js`:

| Key | Display Name | Group | Question ID | Scoring |
|-----|--------------|-------|-------------|---------|
| `cognitive` | Cognitive | learner_experience | `cog_active_learning` | Mean Likert, reverse=false |
| `social` | Social | learner_experience | `soc_collaboration` | Mean Likert |
| `emotional` | Emotional | learner_experience | `emo_interest` | Mean Likert |
| `self_regulation` | Self-Regulation | learner_experience | `self_focus` | Mean Likert |
| `student_agency` | Student Agency | learner_experience | `agency_voice` | Mean Likert |
| `mitigating_factors` | Mitigating Factors | learner_experience | `mitigate_distraction` | **Reverse scored** |
| `lesson_design` | Lesson Design | instructional_design | `design_structure` | Mean Likert |
| `content_accessibility` | Content Accessibility | instructional_design | `access_content` | Mean Likert |
| `technology_use` | Technology Use | instructional_design | `tech_purpose` | Mean Likert |

Questions: `etl-api/src/constants/questions.js`

---

## 4. Scoring Logic

**File:** `etl-api/src/services/scoring.js`

- Likert scale: 1 (Strongly Disagree) → 5 (Strongly Agree)
- Reverse items: `effectiveScore = 6 - rawValue`
- Subscale score: mean of effective values per category
- Overall score: mean of all selected subscale scores
- Percent: `(score - 1) / 4 × 100`

**Verified:** All-4 responses with mitigating_factors reverse scoring → overall 3.78

---

## 5. AI / Recommendation Connection

**File:** `etl-api/src/services/recommendations.js`

- TEK-Base stub recommends RBIS strategies for subscales below threshold (3.5)
- `BEDROCK_STUB=true` and `OPENSEARCH_STUB=true` by default
- Production integration points documented in `docs/ARCHITECTURE.md`

---

## 6. Privacy / Security Notes

- No student identifiers stored in survey responses
- Teacher ID stored on session (authenticated context assumed for Phase 2)
- Anonymous student survey path has no auth requirement
- Local dev uses demo teacher IDs only

---

## 7. Roadmap Opinion

| Item | Priority | Notes |
|------|----------|-------|
| Teacher auth / SSO | Must-have | Cognito or district IdP |
| Multi-student aggregation | Must-have | Currently single-response batch per submit |
| Production Bedrock integration | Should-have | Replace stub in recommendations |
| OpenSearch RBIS index | Should-have | Replace local strategy map |
| Expanded question bank | Should-have | Random selection per category |
| Admin analytics dashboard | Optional | School/grade aggregates |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full technical reference.
