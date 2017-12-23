class Response {
    send(req, res, data, status)
    {
        res.send(status, Object.assign(data, {
            meta: {
                requestedVersion: req.version(),
                matchedVersion: req.matchedVersion()
            }
        }))
    }
}

module.exports = new Response
