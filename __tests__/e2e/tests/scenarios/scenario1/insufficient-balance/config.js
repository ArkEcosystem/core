"use strict";

module.exports = {
    events: {
        newBlock: {
            5: ["0.0.transfer-new-wallet.action"],
            7: ["0.1.init-2ndsig.action"],
            17: [
                "1.0.transfer.action",
                "1.1.transfer2ndsig.action",
                "1.2.vote.action",
                "1.3.delreg.action",
                "1.4.2ndsigreg.action",
            ],
            19: ["2.check-tx.test"],
        },
    },
};
