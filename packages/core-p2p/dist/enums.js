"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Severity;
(function (Severity) {
    /**
     * Printed at every step of the verification, even if leading to a successful verification.
     * Multiple such messages are printed even for successfully verified peers. To enable these
     * messages define CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA in the environment.
     */
    Severity[Severity["DEBUG_EXTRA"] = 0] = "DEBUG_EXTRA";
    /** One such message per successful peer verification is printed. */
    Severity[Severity["DEBUG"] = 1] = "DEBUG";
    /** Failures to verify peer state, either designating malicious peer or communication issues. */
    Severity[Severity["INFO"] = 2] = "INFO";
})(Severity = exports.Severity || (exports.Severity = {}));
var NetworkStateStatus;
(function (NetworkStateStatus) {
    NetworkStateStatus[NetworkStateStatus["Default"] = 0] = "Default";
    NetworkStateStatus[NetworkStateStatus["BelowMinimumPeers"] = 1] = "BelowMinimumPeers";
    NetworkStateStatus[NetworkStateStatus["Test"] = 2] = "Test";
    NetworkStateStatus[NetworkStateStatus["ColdStart"] = 3] = "ColdStart";
    NetworkStateStatus[NetworkStateStatus["Unknown"] = 4] = "Unknown";
})(NetworkStateStatus = exports.NetworkStateStatus || (exports.NetworkStateStatus = {}));
var SocketErrors;
(function (SocketErrors) {
    SocketErrors["Timeout"] = "CoreTimeoutError";
    SocketErrors["SocketNotOpen"] = "CoreSocketNotOpenError";
    SocketErrors["Validation"] = "CoreValidationError";
})(SocketErrors = exports.SocketErrors || (exports.SocketErrors = {}));
//# sourceMappingURL=enums.js.map