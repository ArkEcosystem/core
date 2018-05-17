'use strict'

/**
 * Filter an Array of Objects based on the given parameters.
 * @param  {Array} items
 * @param  {Object} params
 * @param  {Object} filters
 * @return {Object}
 */
module.exports = (items, params, filters) => {
  return items.filter(item => {
    if (filters.hasOwnProperty('exact')) {
      for (const elem of filters['exact']) {
        if (params[elem] && item[elem] !== params[elem]) {
          return false
        }
      }
    }


    if (filters.hasOwnProperty('between')) {
      for (const elem of filters['between']) {
        if (!params[elem]) {
          continue
        }

        if (!params[elem].hasOwnProperty('from') && !params[elem].hasOwnProperty('to') && item[elem] !== params[elem]) {
          return false
        }

        if (params[elem].hasOwnProperty('from') || params[elem].hasOwnProperty('to')) {
          let isLessThan = true
          let isMoreThan = true

          if (params[elem].hasOwnProperty('from')) {
            isMoreThan = item[elem] >= params[elem].from
          }

          if (params[elem].hasOwnProperty('to')) {
            isLessThan = item[elem] <= params[elem].to
          }

          return isLessThan && isMoreThan
        }
      }
    }

    // NOTE: it was used to filter by `votes`, but that field was rejected and
    // replaced by `vote`. This filter is kept here just in case
    if (filters.hasOwnProperty('any')) {
      for (const elem of filters['any']) {
        if (params[elem] && item[elem]) {
          if (Array.isArray(params[elem])) {
            if (item[elem].every(a => params[elem].indexOf(a) === -1)) {
              return false
            }
          } else {
            throw new Error('Fitering by "any" requires an Array')
          }
        }
      }
    }

    return true
  })
}
