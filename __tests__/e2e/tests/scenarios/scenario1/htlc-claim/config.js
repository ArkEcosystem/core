"use strict";

/*
Test summary :
We want to test that the HTLC workflow lock => claim works as expected.

Workflow :
- step 0 : we just pick from genesis wallet what we need for our test, sending it to a new wallet
- step 1 : we create and send the lock transactions
- step 2 : we check that the lock transactions were forged
- step 3 : we create and send the claim transactions
- step 4 : we check that valid claim transaction were forged and invalid were not
*/

module.exports = {
    events: {
        newBlock: {
            35: ["0.transfer-new-wallet.action"],
            37: ["1.create-lock-txs.action"],
            41: ["2.check-lock.test"],
            43: ["3.create-claim-txs.action"],
            47: ["4.check-claim.test"],
        },
    },
};
