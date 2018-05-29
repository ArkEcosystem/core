'use strict'

/**
 * Create a "where" object for a sequelize query.
 * @param  {Object} params
 * @param  {Object} filters
 * @return {Object}
 */
module.exports = (params, filters) => {
  let where = []

  if (filters.hasOwnProperty('exact')) {
    for (const elem of filters['exact']) {
      if (params[elem]) {
        where.push({
          key: elem,
          value: params[elem],
          operator: '='
        })
      }
    }
  }

  if (filters.hasOwnProperty('between')) {
    for (const elem of filters['between']) {
      if (!params[elem]) {
        continue
      }

      if (!params[elem].hasOwnProperty('from') && !params[elem].hasOwnProperty('to')) {
        where.push({
          key: elem,
          value: params[elem],
          operator: '='
        })
      }

      if (params[elem].hasOwnProperty('from') || params[elem].hasOwnProperty('to')) {
        where[elem] = {}

        if (params[elem].hasOwnProperty('from')) {
          where.push({
            key: elem,
            value: params[elem].from,
            operator: '>='
          })
        }

        if (params[elem].hasOwnProperty('to')) {
          where.push({
            key: elem,
            value: params[elem].to,
            operator: '<='
          })
        }
      }
    }
  }

  if (filters.hasOwnProperty('wildcard')) {
    for (const elem of filters['wildcard']) {
      if (params[elem]) {
        where.push({
          key: elem,
          value: `%${params[elem]}%`,
          operator: 'LIKE'
        })
      }
    }
  }

  return where
}
