const request = require('./request')

module.exports = async (endpoint, limit) => {
  const data = []
  let page = 1
  let maxPages = null
  while (maxPages === null || page <= maxPages) {
    let response = (await request.get(`${endpoint}?page=${page}`)).data
    if (response.data) {
      page++
      maxPages = response.meta.pageCount
      data.push(...response.data)
    }
  }

  return data
}
