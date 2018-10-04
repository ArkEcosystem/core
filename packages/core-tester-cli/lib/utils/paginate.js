const request = require('./request')

module.exports = async (config, endpoint, limit) => {
  const data = []
  let page = 1
  let maxPages = null
  while (maxPages === null || page <= maxPages) {
    let response = (await request(config).get(`${endpoint}?page=${page}`))
    if (response) {
      page++
      maxPages = response.meta.pageCount
      data.push(...response.data)
    }
  }

  return data
}
