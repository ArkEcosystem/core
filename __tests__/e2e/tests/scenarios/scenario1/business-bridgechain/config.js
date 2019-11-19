"use strict";

module.exports = {
    events: {
        newBlock: {
            6: ["0.0.transfer-new-wallet.action"],
            9: ["1.0.business-registration.action"],
            11: ["1.1.check-business-registration.test"],
            12: ["2.0.business-update.action"],
            14: ["2.1.check-business-update.test"],
            15: ["3.0.bridgechain-registration.action"],
            17: ["3.1.check-bridgechain-registration.test"],
            18: ["4.0.bridgechain-update.action"],
            20: ["4.1.check-bridgechain-update.test"],
            21: ["5.0.bridgechain-resignation.action"],
            23: ["5.1.check-bridgechain-resignation.test"],
            24: ["6.0.business-resignation.action"],
            26: ["6.1.check-business-resignation.test"],
        },
    },
};
