/**
 * TEK-Base recommendation engine (local stub).
 * Production uses OpenSearch RBIS retrieval + AWS Bedrock/Claude.
 */

const RBIS_STRATEGIES = {
  cognitive: {
    title: 'Promote active student learning through class discussion',
    goal: 'Increase active learning and cognitive engagement',
    steps: [
      'Pose an open-ended question related to the lesson objective',
      'Use think-pair-share before whole-class discussion',
      'Summarize key student contributions',
    ],
    citations: [
      'Hamann et al. (2012) — Assessing Student Perceptions of Discussion Benefits',
      'Murphy et al. (2009) — Meta-analysis of classroom discussion effects',
    ],
  },
  social: {
    title: 'Structured peer collaboration',
    goal: 'Increase meaningful peer interaction',
    steps: [
      'Assign clear roles for group work',
      'Provide a collaboration protocol or sentence starters',
      'Debrief group findings with the class',
    ],
    citations: ['Johnson & Johnson (2009) — Cooperative Learning'],
  },
  emotional: {
    title: 'Build emotional safety and interest',
    goal: 'Increase student interest and positive affect',
    steps: [
      'Connect lesson content to student interests',
      'Celebrate effort and progress publicly',
      'Use brief energizers when energy drops',
    ],
    citations: ['Fredricks et al. (2004) — School Engagement'],
  },
  self_regulation: {
    title: 'Scaffold attention and self-monitoring',
    goal: 'Help students manage focus during learning',
    steps: [
      'Post visible learning goals for the lesson',
      'Build in short self-check moments',
      'Model think-aloud for staying on task',
    ],
    citations: ['Zimmerman (2002) — Self-Regulated Learning'],
  },
  student_agency: {
    title: 'Increase student voice and choice',
    goal: 'Give students ownership over their learning',
    steps: [
      'Offer a meaningful choice in product or process',
      'Invite student questions to drive inquiry',
      'Reflect on student suggestions in the next lesson',
    ],
    citations: ['Toshalis & Nakkula (2012) — Motivation, Engagement, and Student Voice'],
  },
  mitigating_factors: {
    title: 'Reduce engagement barriers',
    goal: 'Minimize distractions and off-task behavior',
    steps: [
      'Audit physical and digital distractions',
      'Establish clear transitions between activities',
      'Use proximity and positive redirection',
    ],
    citations: ['Marzano (2003) — Classroom Management'],
  },
  lesson_design: {
    title: 'Improve lesson structure and pacing',
    goal: 'Make the lesson easier to follow',
    steps: [
      'Use an agenda visible to students',
      'Chunk content into 10–15 minute segments',
      'Close with a clear summary and exit ticket',
    ],
    citations: ['Wiggins & McTighe (2005) — Understanding by Design'],
  },
  content_accessibility: {
    title: 'Universal Design for Learning adjustments',
    goal: 'Make content accessible to all learners',
    steps: [
      'Provide content in multiple modalities',
      'Use graphic organizers and vocabulary supports',
      'Check for understanding with varied response formats',
    ],
    citations: ['CAST (2018) — UDL Guidelines 2.2'],
  },
  technology_use: {
    title: 'Purposeful technology integration',
    goal: 'Ensure technology supports learning goals',
    steps: [
      'Align each tech tool to a specific learning objective',
      'Model the tool before independent use',
      'Gather student feedback on tech effectiveness',
    ],
    citations: ['Chen et al. (2010) — Engaging Online Learners'],
  },
};

/**
 * Recommend strategies for subscales scoring below threshold.
 * @param {object} report - scored engagement report
 * @param {number} threshold - effective score threshold (default 3.5)
 */
function generateRecommendations(report, threshold = 3.5) {
  const useBedrockStub = process.env.BEDROCK_STUB !== 'false';
  const useOpenSearchStub = process.env.OPENSEARCH_STUB !== 'false';

  const lowSubscales = (report.subscaleScores || [])
    .filter((s) => s.score !== null && s.score < threshold)
    .sort((a, b) => a.score - b.score);

  const recommendations = lowSubscales.map((subscale) => {
    const strategy = RBIS_STRATEGIES[subscale.categoryKey] || {
      title: 'Review instructional strategies for this category',
      goal: `Improve ${subscale.displayName} engagement`,
      steps: ['Consult TEK-Base knowledge base'],
      citations: [],
    };

    return {
      categoryKey: subscale.categoryKey,
      displayName: subscale.displayName,
      currentScore: subscale.score,
      priority: subscale.score < 2.5 ? 'high' : 'medium',
      strategy,
      aiGenerated: false,
      source: useOpenSearchStub ? 'local-rbis-stub' : 'opensearch',
    };
  });

  return {
    sessionId: report.sessionId,
    overallScore: report.overallScore,
    threshold,
    recommendations,
    metadata: {
      bedrockStub: useBedrockStub,
      openSearchStub: useOpenSearchStub,
      generatedAt: new Date().toISOString(),
      note: useBedrockStub
        ? 'AI activity generation stubbed locally. Set BEDROCK_STUB=false for production Bedrock integration.'
        : 'Production Bedrock integration enabled.',
    },
  };
}

module.exports = { generateRecommendations, RBIS_STRATEGIES };
