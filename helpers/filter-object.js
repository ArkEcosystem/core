module.exports = (object, params, filters) => {
  return Promise.resolve(object.filter(account => {
    if (filters.hasOwnProperty('exact')) {
      for (const elem of filters['exact']) {
        if (params[elem] && account[elem] !== params[elem]) return false
      }
    }

    if (filters.hasOwnProperty('between')) {
      for (const elem of filters['between']) {
        if (!params[elem]) continue

        if (!params[elem].from && !params[elem].to && account[elem] !== params[elem]) return false

        if (params[elem].from || params[elem].to) {
          let isLessThan = true
          let isMoreThan = true

          if (params[elem].from) isMoreThan = account[elem] >= params[elem].from
          if (params[elem].to) isLessThan = account[elem] <= params[elem].from

          return (!isLessThan || !isMoreThan)
        }
      }
    }
  }))
}
