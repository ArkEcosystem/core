export declare enum Severity {
    /**
     * Printed at every step of the verification, even if leading to a successful verification.
     * Multiple such messages are printed even for successfully verified peers. To enable these
     * messages define CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA in the environment.
     */
    DEBUG_EXTRA = 0,
    /** One such message per successful peer verification is printed. */
    DEBUG = 1,
    /** Failures to verify peer state, either designating malicious peer or communication issues. */
    INFO = 2
}
export declare enum NetworkStateStatus {
    Default = 0,
    BelowMinimumPeers = 1,
    Test = 2,
    ColdStart = 3,
    Unknown = 4
}
export declare enum SocketErrors {
    Timeout = "CoreTimeoutError",
    SocketNotOpen = "CoreSocketNotOpenError",
    Validation = "CoreValidationError"
}
