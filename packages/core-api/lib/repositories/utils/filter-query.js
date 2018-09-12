'use strict'

/**
 * Create a "where" object for a sql query.
 * @param  {Object} parameters
 * @param  {Object} filters
 * @return {Object}
 */
module.exports = (parameters, filters) => {
  let where = []

  if (filters.hasOwnProperty('exact')) {
    for (const elem of filters['exact']) {
      if (typeof parameters[elem] !== 'undefined') {
        where.push({
          column: elem,
          method: 'equals',
          value: parameters[elem]
        })
      }
    }
  }

  if (filters.hasOwnProperty('between')) {
    for (const elem of filters['between']) {
      if (!parameters[elem]) {
        continue
      }

      if (!parameters[elem].hasOwnProperty('from') && !parameters[elem].hasOwnProperty('to')) {
        where.push({
          column: elem,
          method: 'equals',
          value: parameters[elem]
        })
      }

      if (parameters[elem].hasOwnProperty('from') || parameters[elem].hasOwnProperty('to')) {
        where[elem] = {}

        if (parameters[elem].hasOwnProperty('from')) {
          where.push({
            column: elem,
            method: 'gte',
            value: parameters[elem].from
          })
        }

        if (parameters[elem].hasOwnProperty('to')) {
          where.push({
            column: elem,
            method: 'lte',
            value: parameters[elem].to
          })
        }
      }
    }
  }

  if (filters.hasOwnProperty('wildcard')) {
    for (const elem of filters['wildcard']) {
      if (parameters[elem]) {
        where.push({
          column: elem,
          method: 'like',
          value: `%${parameters[elem]}%`
        })
      }
    }
  }

  return where
}
