"use strict";

/*
Test summary :
We want to test that the multisig transactions work as expected.

Workflow :
- step 0 : we just pick from genesis wallet what we need for our test, sending it to a new wallet
- step 1 : we create and send the multisig registration transaction
- step 2 : we check that the registration transaction was forged
- step 3 : we create and send the multisigned transactions
- step 4 : we check that valid multisigned transactions were forged and invalid were not
*/

module.exports = {
    events: {
        newBlock: {
            62: ["0.transfer-new-wallet.action"],
            65: ["1.create-multisig-registration.action"],
            69: ["2.check-registration.test"],
            70: ["3.transfer-multisig-wallet.action"],
            74: ["4.create-valid-multisig-txs.action"],
            76: ["5.create-invalid-multisig-txs.action"],
            79: ["6.check-multisig.test"],
        },
    },
};
