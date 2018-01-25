const State = requireFrom('api/plugins/state')

class Response {
  send (status, data, headers) {
    const request = State.getRequest()

    State.getResponse().send(status, { ...data,
      ...{
        meta: { ...data.meta || {},
          ...{
            requestedVersion: request.version(),
            matchedVersion: request.matchedVersion()
          }
        }
      }
    }, headers)
  }
}

module.exports = new Response()
