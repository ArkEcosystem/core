const errors = require('restify-errors')

class Responder {
  createResponse (name, request, response, data, headers) {
    const version = {
      '1.0.0': 'v1',
      '2.0.0': 'v2'
    }[request.version()]

    requireFrom(`api/public/${version}/responses/${name}`).send(request, response, data, headers)
  }

  ok (request, response, data, headers = {}) {
    this.createResponse('ok', request, response, data, headers)
  }

  created (request, response, data, headers = {}) {
    this.createResponse('created', request, response, data, headers)
  }

  noContent (request, response, data, headers = {}) {
    this.createResponse('no-content', request, response, data, headers)
  }

  error (request, response, data, headers = {}) {
    this.createResponse('error', request, response, data, headers) // only for v1
  }

  badRequest (response, message) {
    return response.send(new errors.BadRequestError(message)) // (400 Bad Request)
  }

  unauthorized (response, message) {
    return response.send(new errors.UnauthorizedError(message)) // (401 Unauthorized)
  }

  paymentRequired (response, message) {
    return response.send(new errors.PaymentRequiredError(message)) // (402 Payment Required)
  }

  forbidden (response, message) {
    return response.send(new errors.ForbiddenError(message)) // (403 Forbidden)
  }

  notFound (response, message) {
    return response.send(new errors.NotFoundError(message)) // (404 Not Found)
  }

  methodNotAllowed (response, message) {
    return response.send(new errors.MethodNotAllowedError(message)) // (405 Method Not Allowed)
  }

  notAcceptable (response, message) {
    return response.send(new errors.NotAcceptableError(message)) // (406 Not Acceptable)
  }

  proxyAuthenticationRequired (response, message) {
    return response.send(new errors.ProxyAuthenticationRequiredError(message)) // (407 Proxy Authentication Required)
  }

  requestTimeout (response, message) {
    return response.send(new errors.RequestTimeoutError(message)) // (408 Request Time-out)
  }

  conflict (response, message) {
    return response.send(new errors.ConflictError(message)) // (409 Conflict)
  }

  gone (response, message) {
    return response.send(new errors.GoneError(message)) // (410 Gone)
  }

  lengthRequired (response, message) {
    return response.send(new errors.LengthRequiredError(message)) // (411 Length Required)
  }

  preconditionFailed (response, message) {
    return response.send(new errors.PreconditionFailedError(message)) // (412 Precondition Failed)
  }

  requestEntityTooLarge (response, message) {
    return response.send(new errors.RequestEntityTooLargeError(message)) // (413 Request Entity Too Large)
  }

  requesturiTooLarge (response, message) {
    return response.send(new errors.RequesturiTooLargeError(message)) // (414 Request-URI Too Large)
  }

  unsupportedMediaType (response, message) {
    return response.send(new errors.UnsupportedMediaTypeError(message)) // (415 Unsupported Media Type)
  }

  requestedRangeNotSatisfiable (response, message) {
    return response.send(new errors.RequestedRangeNotSatisfiableError(message)) // (416 Requested Range Not Satisfiable)
  }

  expectationFailed (response, message) {
    return response.send(new errors.ExpectationFailedError(message)) // (417 Expectation Failed)
  }

  imATeapot (response, message) {
    return response.send(new errors.ImATeapotError(message)) // (418 I’m a teapot)
  }

  unprocessableEntity (response, message) {
    return response.send(new errors.UnprocessableEntityError(message)) // (422 Unprocessable Entity)
  }

  locked (response, message) {
    return response.send(new errors.LockedError(message)) // (423 Locked)
  }

  failedDependency (response, message) {
    return response.send(new errors.FailedDependencyError(message)) // (424 Failed Dependency)
  }

  unorderedCollection (response, message) {
    return response.send(new errors.UnorderedCollectionError(message)) // (425 Unordered Collection)
  }

  upgradeRequired (response, message) {
    return response.send(new errors.UpgradeRequiredError(message)) // (426 Upgrade Required)
  }

  preconditionRequired (response, message) {
    return response.send(new errors.PreconditionRequiredError(message)) // (428 Precondition Required)
  }

  tooManyRequests (response, message) {
    return response.send(new errors.TooManyRequestsError(message)) // (429 Too Many Requests)
  }

  requestHeaderFieldsTooLarge (response, message) {
    return response.send(new errors.RequestHeaderFieldsTooLargeError(message)) // (431 Request Header Fields Too Large)
  }

  internalServerError (response, message) {
    return response.send(new errors.InternalServerError(message)) // (500 Internal Server Error)
  }

  notImplemented (response, message) {
    return response.send(new errors.NotImplementedError(message)) // (501 Not Implemented)
  }

  badGateway (response, message) {
    return response.send(new errors.BadGatewayError(message)) // (502 Bad Gateway)
  }

  serviceUnavailable (response, message) {
    return response.send(new errors.ServiceUnavailableError(message)) // (503 Service Unavailable)
  }

  gatewayTimeout (response, message) {
    return response.send(new errors.GatewayTimeoutError(message)) // (504 Gateway Time-out)
  }

  httpVersionNotSupported (response, message) {
    return response.send(new errors.HttpVersionNotSupportedError(message)) // (505 HTTP Version Not Supported)
  }

  variantAlsoNegotiates (response, message) {
    return response.send(new errors.VariantAlsoNegotiatesError(message)) // (506 Variant Also Negotiates)
  }

  insufficientStorage (response, message) {
    return response.send(new errors.InsufficientStorageError(message)) // (507 Insufficient Storage)
  }

  bandwidthLimitExceeded (response, message) {
    return response.send(new errors.BandwidthLimitExceededError(message)) // (509 Bandwidth Limit Exceeded)
  }

  notExtended (response, message) {
    return response.send(new errors.NotExtendedError(message)) // (510 Not Extended)
  }

  networkAuthenticationRequired (response, message) {
    return response.send(new errors.NetworkAuthenticationRequiredError(message)) // (511 Network Authentication Required)
  }

  badDigest (response, message) {
    return response.send(new errors.BadDigestError(message)) // (400 Bad Request)
  }

  badMethod (response, message) {
    return response.send(new errors.BadMethodError(message)) // (405 Method Not Allowed)
  }

  internal (response, message) {
    return response.send(new errors.InternalError(message)) // (500 Internal Server Error)
  }

  invalidArgument (response, message) {
    return response.send(new errors.InvalidArgumentError(message)) // (409 Conflict)
  }

  invalidContent (response, message) {
    return response.send(new errors.InvalidContentError(message)) // (400 Bad Request)
  }

  invalidCredentials (response, message) {
    return response.send(new errors.InvalidCredentialsError(message)) // (401 Unauthorized)
  }

  invalidHeader (response, message) {
    return response.send(new errors.InvalidHeaderError(message)) // (400 Bad Request)
  }

  invalidVersion (response, message) {
    return response.send(new errors.InvalidVersionError(message)) // (400 Bad Request)
  }

  missingParameter (response, message) {
    return response.send(new errors.MissingParameterError(message)) // (409 Conflict)
  }

  notAuthorized (response, message) {
    return response.send(new errors.NotAuthorizedError(message)) // (403 Forbidden)
  }

  requestExpired (response, message) {
    return response.send(new errors.RequestExpiredError(message)) // (400 Bad Request)
  }

  requestThrottled (response, message) {
    return response.send(new errors.RequestThrottledError(message)) // (429 Too Many Requests)
  }

  resourceNotFound (response, message) {
    return response.send(new errors.ResourceNotFoundError(message)) // (404 Not Found)
  }

  wrongAccept (response, message) {
    return response.send(new errors.WrongAcceptError(message)) // (406 Not Acceptable)
  }
}

module.exports = new Responder()
