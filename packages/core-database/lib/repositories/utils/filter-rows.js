/**
 * Filter an Array of Objects based on the given parameters.
 * @param  {Array} rows
 * @param  {Object} params
 * @param  {Object} filters
 * @return {Array}
 */
module.exports = (rows, params, filters) =>
  rows.filter(item => {
    if (filters.exact) {
      for (const elem of filters.exact) {
        if (params[elem] && item[elem] !== params[elem]) {
          return false
        }
      }
    }

    if (filters.between) {
      for (const elem of filters.between) {
        if (!params[elem]) {
          continue
        }

        if (
          !params[elem].from &&
          !params[elem].to &&
          item[elem] !== params[elem]
        ) {
          return false
        }

        if (params[elem].from || params[elem].to) {
          let isMoreThan = true
          let isLessThan = true

          if (params[elem].from) {
            isMoreThan = item[elem] >= params[elem].from
          }

          if (params[elem].to) {
            isLessThan = item[elem] <= params[elem].to
          }

          return isMoreThan && isLessThan
        }
      }
    }

    // NOTE: it was used to filter by `votes`, but that field was rejected and
    // replaced by `vote`. This filter is kept here just in case
    if (filters.any) {
      for (const elem of filters.any) {
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
