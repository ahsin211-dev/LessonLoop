# LessonLoop Phase 1 — Codebase Review & Familiarity Task Report

**Date:** 2026-06-24  
**Status:** Complete  
**See also:** [Phase 2 Implementation](PHASE2_IMPLEMENTATION.md)

---

## Executive Summary

LessonLoop was built from scratch as a working reference implementation when production repositories were unavailable. Phase 1 established the core SES survey-to-score pipeline. Phase 2 added auth, multi-student aggregation, expanded question bank, AI services, and analytics.

---

## 1. Local Setup Result

### Repositories

| Repo | Path | Status |
|------|------|--------|
| Backend | `etl-api/` | Complete |
| Frontend | `website/` | Complete |
| Monorepo root | `/` | `docker-compose.yml`, docs, CI |

### Quick Start

```bash
docker compose up --build
# Website: http://localhost:3000
# API: http://localhost:3001/local
```

### Tests

```bash
cd etl-api && npm test          # 9 unit tests
cd etl-api && npm run test:integration  # E2E (requires running API)
```

---

## 2. Survey-to-Score Data Flow

```
Teacher Login (/login)
  → POST /auth/login

Teacher Dashboard (/)
  → POST /surveys/sessions (auth)
  → DynamoDB SESSION#{id}/METADATA

Student Survey (/survey/{sessionId})
  → GET /surveys/sessions/{id}
  → POST /surveys/sessions/{id}/responses (with respondentId)
  → DynamoDB SESSION#{id}/RESPONSE#{responseId}

Teacher Closes Session (/sessions/{id})
  → POST /surveys/sessions/{id}/complete (auth)
  → scoring.js computeEngagementScores() — multi-student aggregation
  → DynamoDB SESSION#{id}/REPORT

Teacher Report (/reports/{sessionId})
  → GET /reports/{id} (auth)
  → GET /reports/{id}/recommendations (auth) — TEK-Base + Bedrock stub
```

---

## 3. Nine Subscale Mapping

Defined in `etl-api/src/constants/subscales.js`:

| Key | Display Name | Group |
|-----|--------------|-------|
| `cognitive` | Cognitive | learner_experience |
| `social` | Social | learner_experience |
| `emotional` | Emotional | learner_experience |
| `self_regulation` | Self-Regulation | learner_experience |
| `student_agency` | Student Agency | learner_experience |
| `mitigating_factors` | Mitigating Factors | learner_experience (reverse-scored) |
| `lesson_design` | Lesson Design | instructional_design |
| `content_accessibility` | Content Accessibility | instructional_design |
| `technology_use` | Technology Use | instructional_design |

27 questions in `etl-api/src/constants/questions.js` (3 per category).

---

## 4. Scoring Logic

**File:** `etl-api/src/services/scoring.js`

1. Likert 1–5 per question
2. Reverse scoring for `mitigating_factors`: `effective = 6 - raw`
3. Per student: mean effective score per category
4. Per category: mean across students
5. Overall: mean of category scores
6. Report includes `studentCount` and `questionBreakdown`

---

## 5. AI / Recommendation Connection

- **TEK-Base:** `recommendations.js` → OpenSearch RBIS + Bedrock activity
- **Stubs:** enabled by default for local dev
- **Production:** set `BEDROCK_STUB=false`, `OPENSEARCH_STUB=false`

---

## 6. Privacy / Security Notes

- Student surveys anonymous — `respondentId` is random UUID, not PII
- Teacher routes require JWT (dev) or Cognito token (production)
- No student names/IDs stored
- FERPA: reports confidential to authenticated teacher

---

## 7. Phase 2 Completion Status

| Roadmap Item | Status |
|--------------|--------|
| Teacher auth / SSO | Dev JWT + Cognito-ready |
| Multi-student aggregation | Complete |
| Expanded question bank | 27 questions, random pick |
| Bedrock integration | Stub + production path |
| OpenSearch RBIS | Stub + production path |
| Admin analytics | `GET /analytics` + `/analytics` page |
| CI test gate | GitHub Actions |

See [PHASE2_IMPLEMENTATION.md](PHASE2_IMPLEMENTATION.md) for full details.
