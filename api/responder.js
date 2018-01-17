const errors = require('restify-errors')
const MethodMissing = requireFrom('helpers/method-missing')

class Responder extends MethodMissing {
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

  methodMissing (name, ...args) {
    const errorClasses = {
      badRequest: 'BadRequestError',
      unauthorized: 'UnauthorizedError',
      paymentRequired: 'PaymentRequiredError',
      forbidden: 'ForbiddenError',
      notFound: 'NotFoundError',
      methodNotAllowed: 'MethodNotAllowedError',
      notAcceptable: 'NotAcceptableError',
      proxyAuthenticationRequired: 'ProxyAuthenticationRequiredError',
      requestTimeout: 'RequestTimeoutError',
      conflict: 'ConflictError',
      gone: 'GoneError',
      lengthRequired: 'LengthRequiredError',
      preconditionFailed: 'PreconditionFailedError',
      requestEntityTooLarge: 'RequestEntityTooLargeError',
      requesturiTooLarge: 'RequesturiTooLargeError',
      unsupportedMediaType: 'UnsupportedMediaTypeError',
      requestedRangeNotSatisfiable: 'RequestedRangeNotSatisfiableError',
      expectationFailed: 'ExpectationFailedError',
      imATeapot: 'ImATeapotError',
      unprocessableEntity: 'UnprocessableEntityError',
      locked: 'LockedError',
      failedDependency: 'FailedDependencyError',
      unorderedCollection: 'UnorderedCollectionError',
      upgradeRequired: 'UpgradeRequiredError',
      preconditionRequired: 'PreconditionRequiredError',
      tooManyRequests: 'TooManyRequestsError',
      requestHeaderFieldsTooLarge: 'RequestHeaderFieldsTooLargeError',
      internalServerError: 'InternalServerError',
      notImplemented: 'NotImplementedError',
      badGateway: 'BadGatewayError',
      serviceUnavailable: 'ServiceUnavailableError',
      gatewayTimeout: 'GatewayTimeoutError',
      httpVersionNotSupported: 'HttpVersionNotSupportedError',
      variantAlsoNegotiates: 'VariantAlsoNegotiatesError',
      insufficientStorage: 'InsufficientStorageError',
      bandwidthLimitExceeded: 'BandwidthLimitExceededError',
      notExtended: 'NotExtendedError',
      networkAuthenticationRequired: 'NetworkAuthenticationRequiredError',
      badDigest: 'BadDigestError',
      badMethod: 'BadMethodError',
      internal: 'InternalError',
      invalidArgument: 'InvalidArgumentError',
      invalidContent: 'InvalidContentError',
      invalidCredentials: 'InvalidCredentialsError',
      invalidHeader: 'InvalidHeaderError',
      invalidVersion: 'InvalidVersionError',
      missingParameter: 'MissingParameterError',
      notAuthorized: 'NotAuthorizedError',
      requestExpired: 'RequestExpiredError',
      requestThrottled: 'RequestThrottledError',
      resourceNotFound: 'ResourceNotFoundError',
      wrongAccept: 'WrongAcceptError'
    }

    if (errors.hasOwnProperty(errorClasses[name])) {
      return args[0].send(new errors[errorClasses[name]](args[1]))
    }

    throw new Error(`Method "${name}" does not exist.`);
  }
}

module.exports = new Responder()
