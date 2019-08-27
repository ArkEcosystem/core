export enum Severity {
    /**
     * Printed at every step of the verification, even if leading to a successful verification.
     * Multiple such messages are printed even for successfully verified peers. To enable these
     * messages define CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA in the environment.
     */
    DEBUG_EXTRA,

    /** One such message per successful peer verification is printed. */
    DEBUG,

    /** Failures to verify peer state, either designating malicious peer or communication issues. */
    INFO,
}

export enum NetworkStateStatus {
    Default,
    BelowMinimumPeers,
    Test,
    Unknown,
}

export enum SocketErrors {
    Timeout = "CoreTimeoutError",
    SocketNotOpen = "CoreSocketNotOpenError",
    WrongEndpoint = "CoreWrongEndpointError",
    AppNotReady = "CoreAppNotReadyError",
    HeadersRequired = "CoreHeadersRequiredError",
    ForgerNotAuthorized = "CoreForgerNotAuthorizedError",
    Unknown = "CoreUnknownError",
    Validation = "CoreValidationError",
    RateLimitExceeded = "CoreRateLimitExceededError",
    Forbidden = "CoreForbiddenError",
    InvalidMessagePayload = "CoreInvalidMessagePayloadError",
}
