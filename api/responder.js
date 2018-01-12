var errors = require('restify-errors')

class Responder {
  createResponse (name, req, res, data, headers) {
    const version = {
      '1.0.0': 'v1',
      '2.0.0': 'v2'
    }[req.version()]

    requireFrom(`api/public/${version}/responses/${name}`).send(req, res, data, headers)
  }

  ok (req, res, data, headers = {}) {
    this.createResponse('ok', req, res, data, headers)
  }

  created (req, res, data, headers = {}) {
    this.createResponse('created', req, res, data, headers)
  }

  noContent (req, res, data, headers = {}) {
    this.createResponse('no-content', req, res, data, headers)
  }

  error (req, res, data, headers = {}) {
    this.createResponse('error', req, res, data, headers) // only for v1
  }

  badRequest (res, message) {
    return res.send(new errors.BadRequestError(message)) // (400 Bad Request)
  }

  unauthorized (res, message) {
    return res.send(new errors.UnauthorizedError(message)) // (401 Unauthorized)
  }

  paymentRequired (res, message) {
    return res.send(new errors.PaymentRequiredError(message)) // (402 Payment Required)
  }

  forbidden (res, message) {
    return res.send(new errors.ForbiddenError(message)) // (403 Forbidden)
  }

  notFound (res, message) {
    return res.send(new errors.NotFoundError(message)) // (404 Not Found)
  }

  methodNotAllowed (res, message) {
    return res.send(new errors.MethodNotAllowedError(message)) // (405 Method Not Allowed)
  }

  notAcceptable (res, message) {
    return res.send(new errors.NotAcceptableError(message)) // (406 Not Acceptable)
  }

  proxyAuthenticationRequired (res, message) {
    return res.send(new errors.ProxyAuthenticationRequiredError(message)) // (407 Proxy Authentication Required)
  }

  requestTimeout (res, message) {
    return res.send(new errors.RequestTimeoutError(message)) // (408 Request Time-out)
  }

  conflict (res, message) {
    return res.send(new errors.ConflictError(message)) // (409 Conflict)
  }

  gone (res, message) {
    return res.send(new errors.GoneError(message)) // (410 Gone)
  }

  lengthRequired (res, message) {
    return res.send(new errors.LengthRequiredError(message)) // (411 Length Required)
  }

  preconditionFailed (res, message) {
    return res.send(new errors.PreconditionFailedError(message)) // (412 Precondition Failed)
  }

  requestEntityTooLarge (res, message) {
    return res.send(new errors.RequestEntityTooLargeError(message)) // (413 Request Entity Too Large)
  }

  requesturiTooLarge (res, message) {
    return res.send(new errors.RequesturiTooLargeError(message)) // (414 Request-URI Too Large)
  }

  unsupportedMediaType (res, message) {
    return res.send(new errors.UnsupportedMediaTypeError(message)) // (415 Unsupported Media Type)
  }

  requestedRangeNotSatisfiable (res, message) {
    return res.send(new errors.RequestedRangeNotSatisfiableError(message)) // (416 Requested Range Not Satisfiable)
  }

  expectationFailed (res, message) {
    return res.send(new errors.ExpectationFailedError(message)) // (417 Expectation Failed)
  }

  imATeapot (res, message) {
    return res.send(new errors.ImATeapotError(message)) // (418 I’m a teapot)
  }

  unprocessableEntity (res, message) {
    return res.send(new errors.UnprocessableEntityError(message)) // (422 Unprocessable Entity)
  }

  locked (res, message) {
    return res.send(new errors.LockedError(message)) // (423 Locked)
  }

  failedDependency (res, message) {
    return res.send(new errors.FailedDependencyError(message)) // (424 Failed Dependency)
  }

  unorderedCollection (res, message) {
    return res.send(new errors.UnorderedCollectionError(message)) // (425 Unordered Collection)
  }

  upgradeRequired (res, message) {
    return res.send(new errors.UpgradeRequiredError(message)) // (426 Upgrade Required)
  }

  preconditionRequired (res, message) {
    return res.send(new errors.PreconditionRequiredError(message)) // (428 Precondition Required)
  }

  tooManyRequests (res, message) {
    return res.send(new errors.TooManyRequestsError(message)) // (429 Too Many Requests)
  }

  requestHeaderFieldsTooLarge (res, message) {
    return res.send(new errors.RequestHeaderFieldsTooLargeError(message)) // (431 Request Header Fields Too Large)
  }

  internalServerError (res, message) {
    return res.send(new errors.InternalServerError(message)) // (500 Internal Server Error)
  }

  notImplemented (res, message) {
    return res.send(new errors.NotImplementedError(message)) // (501 Not Implemented)
  }

  badGateway (res, message) {
    return res.send(new errors.BadGatewayError(message)) // (502 Bad Gateway)
  }

  serviceUnavailable (res, message) {
    return res.send(new errors.ServiceUnavailableError(message)) // (503 Service Unavailable)
  }

  gatewayTimeout (res, message) {
    return res.send(new errors.GatewayTimeoutError(message)) // (504 Gateway Time-out)
  }

  httpVersionNotSupported (res, message) {
    return res.send(new errors.HttpVersionNotSupportedError(message)) // (505 HTTP Version Not Supported)
  }

  variantAlsoNegotiates (res, message) {
    return res.send(new errors.VariantAlsoNegotiatesError(message)) // (506 Variant Also Negotiates)
  }

  insufficientStorage (res, message) {
    return res.send(new errors.InsufficientStorageError(message)) // (507 Insufficient Storage)
  }

  bandwidthLimitExceeded (res, message) {
    return res.send(new errors.BandwidthLimitExceededError(message)) // (509 Bandwidth Limit Exceeded)
  }

  notExtended (res, message) {
    return res.send(new errors.NotExtendedError(message)) // (510 Not Extended)
  }

  networkAuthenticationRequired (res, message) {
    return res.send(new errors.NetworkAuthenticationRequiredError(message)) // (511 Network Authentication Required)
  }

  badDigest (res, message) {
    return res.send(new errors.BadDigestError(message)) // (400 Bad Request)
  }

  badMethod (res, message) {
    return res.send(new errors.BadMethodError(message)) // (405 Method Not Allowed)
  }

  internal (res, message) {
    return res.send(new errors.InternalError(message)) // (500 Internal Server Error)
  }

  invalidArgument (res, message) {
    return res.send(new errors.InvalidArgumentError(message)) // (409 Conflict)
  }

  invalidContent (res, message) {
    return res.send(new errors.InvalidContentError(message)) // (400 Bad Request)
  }

  invalidCredentials (res, message) {
    return res.send(new errors.InvalidCredentialsError(message)) // (401 Unauthorized)
  }

  invalidHeader (res, message) {
    return res.send(new errors.InvalidHeaderError(message)) // (400 Bad Request)
  }

  invalidVersion (res, message) {
    return res.send(new errors.InvalidVersionError(message)) // (400 Bad Request)
  }

  missingParameter (res, message) {
    return res.send(new errors.MissingParameterError(message)) // (409 Conflict)
  }

  notAuthorized (res, message) {
    return res.send(new errors.NotAuthorizedError(message)) // (403 Forbidden)
  }

  requestExpired (res, message) {
    return res.send(new errors.RequestExpiredError(message)) // (400 Bad Request)
  }

  requestThrottled (res, message) {
    return res.send(new errors.RequestThrottledError(message)) // (429 Too Many Requests)
  }

  resourceNotFound (res, message) {
    return res.send(new errors.ResourceNotFoundError(message)) // (404 Not Found)
  }

  wrongAccept (res, message) {
    return res.send(new errors.WrongAcceptError(message)) // (406 Not Acceptable)
  }
}

module.exports = new Responder()
