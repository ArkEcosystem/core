class Response {
    send(res, data, status, headers = {}) {
        res.send(status, Object.assign(data, {
            meta: {
                requestedVersion: req.version(),
                matchedVersion: req.matchedVersion()
            }
        }), headers)
    }
}

module.exports = new Response
