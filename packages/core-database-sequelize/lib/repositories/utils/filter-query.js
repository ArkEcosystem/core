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
      if (typeof params[elem] !== 'undefined') {
        where.push({
          column: elem,
          operator: '=',
          value: params[elem]
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
          column: elem,
          operator: '=',
          value: params[elem]
        })
      }

      if (params[elem].hasOwnProperty('from') || params[elem].hasOwnProperty('to')) {
        where[elem] = {}

        if (params[elem].hasOwnProperty('from')) {
          where.push({
            column: elem,
            operator: '>=',
            value: params[elem].from
          })
        }

        if (params[elem].hasOwnProperty('to')) {
          where.push({
            column: elem,
            operator: '<=',
            value: params[elem].to
          })
        }
      }
    }
  }

  if (filters.hasOwnProperty('wildcard')) {
    for (const elem of filters['wildcard']) {
      if (params[elem]) {
        where.push({
          column: elem,
          operator: 'LIKE',
          value: `%${params[elem]}%`
        })
      }
    }
  }

  return where
}
