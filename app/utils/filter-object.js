module.exports = async (object, params, filters) => {
  return object.filter(item => {
    if (filters.hasOwnProperty('exact')) {
      for (const elem of filters['exact']) {
        if (params[elem] && item[elem] !== params[elem]) return false
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

    return true
  })
}
