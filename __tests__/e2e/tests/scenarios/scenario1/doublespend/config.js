"use strict";

module.exports = {
    events: {
        newBlock: {
            5: ["0.0.transfer-new-wallet.action"],
            7: ["0.1.init-2ndsig.action"],
            16: [
                "1.0.doubletransfer.action",
                "1.1.doubletransfer2ndsig.action",
                "1.2.doublevote.action",
                "1.3.doubledelreg.action",
                "1.4.double2ndsigreg.action",
            ],
            19: ["2.check-tx.test"],
        },
    },
};
