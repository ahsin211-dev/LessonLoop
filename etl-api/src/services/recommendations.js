/**
 * TEK-Base recommendation engine.
 * Uses OpenSearch RBIS retrieval + AWS Bedrock activity generation.
 */

const { RBIS_STRATEGIES } = require('../constants/rbis');
const { searchRBIS } = require('./opensearch');
const { generateActivity } = require('./bedrock');

/**
 * Recommend strategies for subscales scoring below threshold.
 */
async function generateRecommendations(report, options = {}) {
  const { threshold = 3.5, lessonTitle, grade, subject, includeActivities = true } = options;
  const useBedrockStub = process.env.BEDROCK_STUB !== 'false';
  const useOpenSearchStub = process.env.OPENSEARCH_STUB !== 'false';

  const lowSubscales = (report.subscaleScores || [])
    .filter((s) => s.score !== null && s.score < threshold)
    .sort((a, b) => a.score - b.score);

  const recommendations = [];

  for (const subscale of lowSubscales) {
    const hits = await searchRBIS({
      categoryKey: subscale.categoryKey,
      query: `${subscale.displayName} engagement instructional strategy`,
    });

    const strategy = hits[0] || RBIS_STRATEGIES[subscale.categoryKey] || {
      title: 'Review instructional strategies for this category',
      goal: `Improve ${subscale.displayName} engagement`,
      steps: ['Consult TEK-Base knowledge base'],
      citations: [],
    };

    const rec = {
      categoryKey: subscale.categoryKey,
      displayName: subscale.displayName,
      currentScore: subscale.score,
      priority: subscale.score < 2.5 ? 'high' : 'medium',
      strategy: {
        title: strategy.title,
        goal: strategy.goal,
        steps: strategy.steps || [],
        citations: strategy.citations || [],
      },
      source: strategy.source || (useOpenSearchStub ? 'local-rbis-stub' : 'opensearch'),
    };

    if (includeActivities) {
      const activity = await generateActivity({
        strategy: rec.strategy,
        lessonTitle: lessonTitle || report.lessonTitle,
        grade,
        subject,
        categoryKey: subscale.categoryKey,
      });
      rec.activity = activity.activity;
      rec.aiGenerated = activity.aiGenerated;
      rec.aiModel = activity.model;
    }

    recommendations.push(rec);
  }

  return {
    sessionId: report.sessionId,
    overallScore: report.overallScore,
    threshold,
    recommendations,
    metadata: {
      bedrockStub: useBedrockStub,
      openSearchStub: useOpenSearchStub,
      generatedAt: new Date().toISOString(),
    },
  };
}

module.exports = { generateRecommendations, RBIS_STRATEGIES };
