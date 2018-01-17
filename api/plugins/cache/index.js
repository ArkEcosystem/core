const redis = requireFrom('core/cache')

module.exports = class Cache {
  before (request, response, next) {
    const cacheKey = this.generateKey(request)

    return redis.get(cacheKey).then((data) => {
      if (!data) {
        response.header('X-Cache', 'MISS')
        return next()
      }

      response.header('X-Cache', 'HIT')
      response.writeHead(200)
      response.end(data)
    })
  }

  after (request, response, route, error) {
    redis.set(this.generateKey(request), response._data);
  }

  generateKey (request) {
    return redis.generateKey({
      url: request.url,
      params: request.params
    })
  }
}
