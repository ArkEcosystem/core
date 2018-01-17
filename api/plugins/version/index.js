const logger = requireFrom('core/logger')
const config = requireFrom('core/config')

module.exports = (request, response, next) => {
  let version = request.header('Accept-Version') || request.header('accept-version');

  if (!version) {
    request._version = config.server.api.version

    logger.debug('Accept-Version Header is undefined. Using [' + request._version + '] as default.')
  }

  if (request.version().startsWith('~')) {
    request._version = {
      1: '1.0.0',
      2: '2.0.0'
    }[version.charAt(1)];
  }

  next()
}
