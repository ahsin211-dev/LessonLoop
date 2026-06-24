const { RBIS_STRATEGIES } = require('../constants/rbis');

const OPENSEARCH_STUB = process.env.OPENSEARCH_STUB !== 'false';
const OPENSEARCH_ENDPOINT = process.env.OPENSEARCH_ENDPOINT || '';

/**
 * Search RBIS instructional strategies by engagement category.
 */
async function searchRBIS({ categoryKey, query, limit = 3 }) {
  if (OPENSEARCH_STUB || !OPENSEARCH_ENDPOINT) {
    const strategy = RBIS_STRATEGIES[categoryKey];
    if (!strategy) return [];
    return [{
      id: `rbis-${categoryKey}-local`,
      categoryKey,
      score: 1.0,
      ...strategy,
      source: 'local-rbis-stub',
    }];
  }

  try {
    const { Client } = require('@opensearch-project/opensearch');
    const { AwsSigv4Signer } = require('@opensearch-project/opensearch/aws');

    const client = new Client({
      ...AwsSigv4Signer({
        region: process.env.AWS_REGION || 'us-east-1',
        service: 'es',
      }),
      node: OPENSEARCH_ENDPOINT,
    });

    const result = await client.search({
      index: process.env.OPENSEARCH_RBIS_INDEX || 'rbis-strategies',
      body: {
        size: limit,
        query: {
          bool: {
            must: [
              { term: { categoryKey } },
              {
                multi_match: {
                  query: query || categoryKey,
                  fields: ['title', 'goal', 'steps'],
                },
              },
            ],
          },
        },
      },
    });

    return (result.body.hits.hits || []).map((hit) => ({
      id: hit._id,
      categoryKey,
      score: hit._score,
      title: hit._source.title,
      goal: hit._source.goal,
      steps: hit._source.steps || [],
      citations: hit._source.citations || [],
      source: 'opensearch',
    }));
  } catch (err) {
    console.error('OpenSearch search failed, falling back to stub:', err.message);
    const strategy = RBIS_STRATEGIES[categoryKey];
    if (!strategy) return [];
    return [{
      id: `rbis-${categoryKey}-fallback`,
      categoryKey,
      score: 1.0,
      ...strategy,
      source: 'local-rbis-fallback',
    }];
  }
}

module.exports = { searchRBIS };
