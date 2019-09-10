"use strict";

module.exports = {
    enabledTests: [
        "chained-tx",
        "doublespend",
        "doublespend-mix",
        "insufficient-balance",
        //'pool-restart',
        "transactions-valid",
        "htlc-claim",
        "htlc-refund",
        "multisignature",
        "multisig-htlc-claim",
        "multisig-htlc-refund"
    ],
};
