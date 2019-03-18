/**
 * Custom socket errors.
 */

export enum SocketErrors {
    Timeout = "CoreTimeoutError",
    SocketNotOpen = "CoreSocketNotOpenError",
    WrongEndpoint = "CoreWrongEndpointError",
    AppNotReady = "CoreAppNotReadyError",
    HeadersRequired = "CoreHeadersRequiredError",
    HeadersValidationFailed = "CoreHeadersValidationFailedError",
    ForgerNotAuthorized = "CoreForgerNotAuthorizedError",
    Unknown = "CoreUnknownError",
    Validation = "CoreValidationError",
    RateLimitExceeded = "CoreRateLimitExceededError",
}
