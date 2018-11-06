'use strict'

const Joi = require('joi')
const client = require('../services/client')

/**
 * @type {Object}
 */
exports.index = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const query = await client.search(request.payload)

    return {
      meta: {
        count: query.hits.total
      },
      data: query.hits.hits.map(result => result._source)
    }
  },
  options: {
    validate: {
      payload: {
        analyzer: Joi.string(),
        analyzeWildcard: Joi.boolean(),
        defaultOperator: Joi.string(),
        df: Joi.string(),
        explain: Joi.boolean(),
        storedFields: Joi.any(),
        docvalueFields: Joi.any(),
        from: Joi.number(),
        allowNoIndices: Joi.boolean(),
        expandWildcards: Joi.string(),
        lenient: Joi.boolean(),
        preference: Joi.string(),
        q: Joi.string(),
        routing: Joi.any(),
        scroll: Joi.string(),
        searchType: Joi.string(),
        size: Joi.number().default(10),
        sort: Joi.any(),
        _source: Joi.any(),
        _sourceExclude: Joi.any(),
        _sourceInclude: Joi.any(),
        terminateAfter: Joi.number(),
        stats: Joi.any(),
        suggestField: Joi.string(),
        suggestMode: Joi.string(),
        suggestSize: Joi.number(),
        suggestText: Joi.string(),
        timeout: Joi.string(),
        trackScores: Joi.boolean(),
        trackTotalHits: Joi.boolean(),
        typedKeys: Joi.boolean(),
        version: Joi.boolean(),
        requestCache: Joi.boolean(),
        batchedReduceSize: Joi.number(),
        maxConcurrentShardRequests: Joi.number(),
        preFilterShardSize: Joi.number(),
        index: Joi.any(),
        type: Joi.any(),
        body: Joi.object()
      }
    }
  }
}
