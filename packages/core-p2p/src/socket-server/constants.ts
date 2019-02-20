/**
 * Custom socket errors.
 */

export enum SocketErrors {
    Timeout = "CoreTimeoutError",
    WrongEndpoint = "CoreWrongEndpointError",
    AppNotReady = "CoreAppNotReadyError",
    HeadersRequired = "CoreHeadersRequiredError",
    HeadersValidationFailed = "CoreHeadersValidationFailedError",
    ForgerNotAuthorized = "CoreForgerNotAuthorizedError",
    Unknown = "CoreUnknownError",
}
