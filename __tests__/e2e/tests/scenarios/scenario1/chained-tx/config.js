"use strict";

/*
Test summary :
We want to test that the pool handles chained transactions correctly.
We should't be able to send A => B and B => C at the same time if B is cold wallet.
B should first have received the A => B transaction (forged in a block) before being able to spend it.

Workflow :
- step 0 : we just pick from genesis wallet what we need for our test, sending it to a new wallet
- step 1 : we send A => B and B => C to node 1
- step 2 : we check if A => B have been forged and not B => C
- step 3 : we send again B => C to node 1
- step 4 : we check if A => B and B => C have been forged
*/

module.exports = {
    events: {
        newBlock: {
            5: ["0.transfer-new-wallet.action"],
            7: ["1.create-transactions.action"],
            9: ["2.check-AtoB-forged.test"],
            10: ["3.resend-BtoC.action"],
            14: ["4.check-BtoC-forged.test"],
        },
    },
};
