"use strict";

/*
Test summary :
We want to test that the multisig transactions work as expected.

Workflow :
- step 0 : we just pick from genesis wallet what we need for our test, sending it to a new wallet
- step 1 : we create and send the multisig registration transaction
- step 2 : we check that the registration transaction was forged
- step 3 : we transfer funds to the multisig wallet
- step 4 : we send the htlc lock transaction (multisigned)
- step 5 : we send the htlc claim transaction (multisigned)
- step 6 : we check that valid multisigned transactions were forged and invalid were not
*/

module.exports = {
    events: {
        newBlock: {
            78: ["0.transfer-new-wallet.action"],
            81: ["1.create-multisig-registration.action"],
            84: ["2.check-registration.test"],
            85: ["3.transfer-multisig-wallet.action"],
            88: ["4.create-lock-multisig-txs.action"],
            91: ["5.create-claim-multisig-txs.action"],
            94: ["6.check-multisig.test"],
        },
    },
};
