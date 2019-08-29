"use strict";

/*
Test summary :
We want to test that the HTLC workflow lock => refund works as expected.

Workflow :
- step 0 : we just pick from genesis wallet what we need for our test, sending it to a new wallet
- step 1 : we create and send the lock transactions
- step 2 : we check that the lock transactions were forged
- step 3 : we create and send the refund transactions
- step 4 : we check that valid refund transaction were forged and invalid were not
*/

module.exports = {
    events: {
        newBlock: {
            45: ["0.transfer-new-wallet.action"],
            47: ["1.create-lock-txs.action"],
            49: ["2.check-lock.test"],
            51: ["3.create-refund-txs.action"],
            54: ["4.check-refund.test"],
        },
    },
};
