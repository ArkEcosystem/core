module.exports = async (object, params, filters) => {
  return object.filter(item => {
    if (filters.hasOwnProperty('exact')) {
      for (const elem of filters['exact']) {
        if (params[elem] && item[elem] !== params[elem]) return false
      }
    }

    if (filters.hasOwnProperty('between')) {
      for (const elem of filters['between']) {
        if (!params[elem]) continue

        if (!params[elem].from && !params[elem].to && item[elem] !== params[elem]) return false

        if (params[elem].from || params[elem].to) {
          let isLessThan = true
          let isMoreThan = true

          if (params[elem].from) isMoreThan = item[elem] >= params[elem].from
          if (params[elem].to) isLessThan = item[elem] <= params[elem].from

          return (!isLessThan || !isMoreThan)
        }
      }
    }

    return true
  })
}
