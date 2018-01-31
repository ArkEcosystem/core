const logger = requireFrom('core/logger')
const MethodMissing = requireFrom('utils/method-missing')
const errors = require('restify-errors')
const path = require('path')
const fs = require('fs')
const _ = require('lodash')

class Responder extends MethodMissing {
  getFilePath (req, name) {
    const version = { '1.0.0': 'v1', '2.0.0': 'v2' }[req.version()]

    return path.resolve(__dirname, `public/${version}/responses/${name}`)
  }

  ok(req, res, data) {
    return require(this.getFilePath(req, 'ok'))(req, res, data)
  }

  created(req, res, data) {
    return require(this.getFilePath(req, 'created'))(req, res, data)
  }

  error(req, res, data) {
    return require(this.getFilePath(req, 'error'))(req, res, data)
  }

  badDigest(req, res, message) { return res.send(new errors.BadDigestError({message})); }
  badRequest(req, res, message) { return res.send(new errors.BadRequestError({message})); }
  invalidContent(req, res, message) { return res.send(new errors.InvalidContentError({message})); }
  invalidHeader(req, res, message) { return res.send(new errors.InvalidHeaderError({message})); }
  invalidVersion(req, res, message) { return res.send(new errors.InvalidVersionError({message})); }
  requestExpired(req, res, message) { return res.send(new errors.RequestExpiredError({message})); }
  invalidCredentials(req, res, message) { return res.send(new errors.InvalidCredentialsError({message})); }
  unauthorized(req, res, message) { return res.send(new errors.UnauthorizedError({message})); }
  paymentRequired(req, res, message) { return res.send(new errors.PaymentRequiredError({message})); }
  forbidden(req, res, message) { return res.send(new errors.ForbiddenError({message})); }
  notAuthorized(req, res, message) { return res.send(new errors.NotAuthorizedError({message})); }
  notFound(req, res, message) { return res.send(new errors.NotFoundError({message})); }
  resourceNotFound(req, res, message) { return res.send(new errors.ResourceNotFoundError({message})); }
  badMethod(req, res, message) { return res.send(new errors.BadMethodError({message})); }
  methodNotAllowed(req, res, message) { return res.send(new errors.MethodNotAllowedError({message})); }
  notAcceptable(req, res, message) { return res.send(new errors.NotAcceptableError({message})); }
  wrongAccept(req, res, message) { return res.send(new errors.WrongAcceptError({message})); }
  proxyAuthenticationRequired(req, res, message) { return res.send(new errors.ProxyAuthenticationRequiredError({message})); }
  requestTimeout(req, res, message) { return res.send(new errors.RequestTimeoutError({message})); }
  conflict(req, res, message) { return res.send(new errors.ConflictError({message})); }
  invalidArgument(req, res, message) { return res.send(new errors.InvalidArgumentError({message})); }
  missingParameter(req, res, message) { return res.send(new errors.MissingParameterError({message})); }
  gone(req, res, message) { return res.send(new errors.GoneError({message})); }
  lengthRequired(req, res, message) { return res.send(new errors.LengthRequiredError({message})); }
  preconditionFailed(req, res, message) { return res.send(new errors.PreconditionFailedError({message})); }
  requestEntityTooLarge(req, res, message) { return res.send(new errors.RequestEntityTooLargeError({message})); }
  requesturiTooLarge(req, res, message) { return res.send(new errors.RequesturiTooLargeError({message})); }
  unsupportedMediaType(req, res, message) { return res.send(new errors.UnsupportedMediaTypeError({message})); }
  rangeNotSatisfiable(req, res, message) { return res.send(new errors.RangeNotSatisfiableError({message})); }
  requestedRangeNotSatisfiable(req, res, message) { return res.send(new errors.RequestedRangeNotSatisfiableError({message})); }
  expectationFailed(req, res, message) { return res.send(new errors.ExpectationFailedError({message})); }
  imATeapot(req, res, message) { return res.send(new errors.ImATeapotError({message})); }
  unprocessableEntity(req, res, message) { return res.send(new errors.UnprocessableEntityError({message})); }
  locked(req, res, message) { return res.send(new errors.LockedError({message})); }
  failedDependency(req, res, message) { return res.send(new errors.FailedDependencyError({message})); }
  unorderedCollection(req, res, message) { return res.send(new errors.UnorderedCollectionError({message})); }
  upgradeRequired(req, res, message) { return res.send(new errors.UpgradeRequiredError({message})); }
  preconditionRequired(req, res, message) { return res.send(new errors.PreconditionRequiredError({message})); }
  requestThrottled(req, res, message) { return res.send(new errors.RequestThrottledError({message})); }
  tooManyRequests(req, res, message) { return res.send(new errors.TooManyRequestsError({message})); }
  requestHeaderFieldsTooLarge(req, res, message) { return res.send(new errors.RequestHeaderFieldsTooLargeError({message})); }
  internal(req, res, message) { return res.send(new errors.InternalError({message})); }
  internalServer(req, res, message) { return res.send(new errors.InternalServerError({message})); }
  notImplemented(req, res, message) { return res.send(new errors.NotImplementedError({message})); }
  badGateway(req, res, message) { return res.send(new errors.BadGatewayError({message})); }
  serviceUnavailable(req, res, message) { return res.send(new errors.ServiceUnavailableError({message})); }
  gatewayTimeout(req, res, message) { return res.send(new errors.GatewayTimeoutError({message})); }
  httpVersionNotSupported(req, res, message) { return res.send(new errors.HttpVersionNotSupportedError({message})); }
  variantAlsoNegotiates(req, res, message) { return res.send(new errors.VariantAlsoNegotiatesError({message})); }
  insufficientStorage(req, res, message) { return res.send(new errors.InsufficientStorageError({message})); }
  bandwidthLimitExceeded(req, res, message) { return res.send(new errors.BandwidthLimitExceededError({message})); }
  notExtended(req, res, message) { return res.send(new errors.NotExtendedError({message})); }
  networkAuthenticationRequired(req, res, message) { return res.send(new errors.NetworkAuthenticationRequiredError({message})); }
}

module.exports = new Responder()
