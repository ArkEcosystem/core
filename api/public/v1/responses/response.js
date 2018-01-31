class Response {
  send (req, res, status, data, headers) {
    res.send(status, { ...data,
      ...{
        meta: { ...data.meta || {},
          ...{
            requestedVersion: req.version(),
            matchedVersion: req.matchedVersion()
          }
        }
      }
    }, headers)
  }
}

module.exports = new Response()
