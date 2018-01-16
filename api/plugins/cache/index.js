const redis = requireFrom('core/cache')
const logger = requireFrom('core/logger')

class Cache {
    before (req, res, next) {
        const cacheKey = redis.generateKey({
            url: req.url,
            params: req.params
        })

        return redis.get(cacheKey).then((data) => {
            if (!data) {
                res.header('X-Cache', 'MISS')
                return next()
            }

            res.header('X-Cache', 'HIT')
            res.writeHead(200)
            res.end(data)
        })
    }

    after (req, res, route, error) {
        const cacheKey = redis.generateKey({
            url: req.url,
            params: req.params
        })

        redis.set(cacheKey, res._data);
    }
}

module.exports = new Cache()
