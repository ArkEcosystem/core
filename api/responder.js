var errors = require('restify-errors')

class Responder {
  createResponse(name, req, res, data, headers) {
    let version = {
      '1.0.0': 'v1',
      '2.0.0': 'v2',
    }[req.version()]

    require(__root + 'api/public/' + version + '/responses/' + name).send(req, res, data, headers)
  }

  ok(req, res, data, headers = {}) {
    this.createResponse('ok', req, res, data, headers)
  }

  created(req, res, data, headers = {}) {
    this.createResponse('created', req, res, data, headers)
  }

  noContent(req, res, data, headers = {}) {
    this.createResponse('no-content', req, res, data, headers)
  }

  error(req, res, data, headers = {}) {
    this.createResponse('error', req, res, data, headers) // only for v1
  }

  badRequest(message) {
    return new errors.BadRequestError(message) // (400 Bad Request)
  }

  unauthorized(message) {
    return new errors.UnauthorizedError(message) // (401 Unauthorized)
  }

  paymentRequired(message) {
    return new errors.PaymentRequiredError(message) // (402 Payment Required)
  }

  forbidden(message) {
    return new errors.ForbiddenError(message) // (403 Forbidden)
  }

  notFound(message) {
    return new errors.NotFoundError(message) // (404 Not Found)
  }

  methodNotAllowed(message) {
    return new errors.MethodNotAllowedError(message) // (405 Method Not Allowed)
  }

  notAcceptable(message) {
    return new errors.NotAcceptableError(message) // (406 Not Acceptable)
  }

  proxyAuthenticationRequired(message) {
    return new errors.ProxyAuthenticationRequiredError(message) // (407 Proxy Authentication Required)
  }

  requestTimeout(message) {
    return new errors.RequestTimeoutError(message) // (408 Request Time-out)
  }

  conflict(message) {
    return new errors.ConflictError(message) // (409 Conflict)
  }

  gone(message) {
    return new errors.GoneError(message) // (410 Gone)
  }

  lengthRequired(message) {
    return new errors.LengthRequiredError(message) // (411 Length Required)
  }

  preconditionFailed(message) {
    return new errors.PreconditionFailedError(message) // (412 Precondition Failed)
  }

  requestEntityTooLarge(message) {
    return new errors.RequestEntityTooLargeError(message) // (413 Request Entity Too Large)
  }

  requesturiTooLarge(message) {
    return new errors.RequesturiTooLargeError(message) // (414 Request-URI Too Large)
  }

  unsupportedMediaType(message) {
    return new errors.UnsupportedMediaTypeError(message) // (415 Unsupported Media Type)
  }

  requestedRangeNotSatisfiable(message) {
    return new errors.RequestedRangeNotSatisfiableError(message) // (416 Requested Range Not Satisfiable)
  }

  expectationFailed(message) {
    return new errors.ExpectationFailedError(message) // (417 Expectation Failed)
  }

  imATeapot(message) {
    return new errors.ImATeapotError(message) // (418 I’m a teapot)
  }

  unprocessableEntity(message) {
    return new errors.UnprocessableEntityError(message) // (422 Unprocessable Entity)
  }

  locked(message) {
    return new errors.LockedError(message) // (423 Locked)
  }

  failedDependency(message) {
    return new errors.FailedDependencyError(message) // (424 Failed Dependency)
  }

  unorderedCollection(message) {
    return new errors.UnorderedCollectionError(message) // (425 Unordered Collection)
  }

  upgradeRequired(message) {
    return new errors.UpgradeRequiredError(message) // (426 Upgrade Required)
  }

  preconditionRequired(message) {
    return new errors.PreconditionRequiredError(message) // (428 Precondition Required)
  }

  tooManyRequests(message) {
    return new errors.TooManyRequestsError(message) // (429 Too Many Requests)
  }

  requestHeaderFieldsTooLarge(message) {
    return new errors.RequestHeaderFieldsTooLargeError(message) // (431 Request Header Fields Too Large)
  }

  internalServerError(message) {
    return new errors.InternalServerError(message) // (500 Internal Server Error)
  }

  notImplemented(message) {
    return new errors.NotImplementedError(message) // (501 Not Implemented)
  }

  badGateway(message) {
    return new errors.BadGatewayError(message) // (502 Bad Gateway)
  }

  serviceUnavailable(message) {
    return new errors.ServiceUnavailableError(message) // (503 Service Unavailable)
  }

  gatewayTimeout(message) {
    return new errors.GatewayTimeoutError(message) // (504 Gateway Time-out)
  }

  httpVersionNotSupported(message) {
    return new errors.HttpVersionNotSupportedError(message) // (505 HTTP Version Not Supported)
  }

  variantAlsoNegotiates(message) {
    return new errors.VariantAlsoNegotiatesError(message) // (506 Variant Also Negotiates)
  }

  insufficientStorage(message) {
    return new errors.InsufficientStorageError(message) // (507 Insufficient Storage)
  }

  bandwidthLimitExceeded(message) {
    return new errors.BandwidthLimitExceededError(message) // (509 Bandwidth Limit Exceeded)
  }

  notExtended(message) {
    return new errors.NotExtendedError(message) // (510 Not Extended)
  }

  networkAuthenticationRequired(message) {
    return new errors.NetworkAuthenticationRequiredError(message) // (511 Network Authentication Required)
  }

  badDigest(message) {
    return new errors.BadDigestError(message) // (400 Bad Request)
  }

  badMethod(message) {
    return new errors.BadMethodError(message) // (405 Method Not Allowed)
  }

  internal(message) {
    return new errors.InternalError(message) // (500 Internal Server Error)
  }

  invalidArgument(message) {
    return new errors.InvalidArgumentError(message) // (409 Conflict)
  }

  invalidContent(message) {
    return new errors.InvalidContentError(message) // (400 Bad Request)
  }

  invalidCredentials(message) {
    return new errors.InvalidCredentialsError(message) // (401 Unauthorized)
  }

  invalidHeader(message) {
    return new errors.InvalidHeaderError(message) // (400 Bad Request)
  }

  invalidVersion(message) {
    return new errors.InvalidVersionError(message) // (400 Bad Request)
  }

  missingParameter(message) {
    return new errors.MissingParameterError(message) // (409 Conflict)
  }

  notAuthorized(message) {
    return new errors.NotAuthorizedError(message) // (403 Forbidden)
  }

  requestExpired(message) {
    return new errors.RequestExpiredError(message) // (400 Bad Request)
  }

  requestThrottled(message) {
    return new errors.RequestThrottledError(message) // (429 Too Many Requests)
  }

  resourceNotFound(message) {
    return new errors.ResourceNotFoundError(message) // (404 Not Found)
  }

  wrongAccept(message) {
    return new errors.WrongAcceptError(message) // (406 Not Acceptable)
  }
}

module.exports = new Responder
