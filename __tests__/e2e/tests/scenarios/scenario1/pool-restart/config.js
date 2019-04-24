'use strict'

/*
Test summary :
We want to test that the pool removes transactions that were forged by the network while it was shut down.

Workflow :
- step 0 : we just pick from genesis wallet what we need for our test, sending it to a new wallet
- step 1 : we send 1 transaction to node1 which broadcasts it right away to the network ;
    we then disconnect node1 from the network and send it another one. This one it will try to broadcast without success.
- step 2 : node1 is still disconnected, we check that it has still the 2 transactions "unconfirmed"
- step 3 : we shut down node1 (killing with sigint for graceful shutdown)
- step 4.0 : we restart node1
- step 4.1 : (executed as soon as node1 is started) we check that the 1st transaction is now confirmed and removed from the pool,
    while the 2nd transaction is still "unconfirmed" and in the pool
- step 5 : we check that node1 doesn't have any unconfirmed transaction anymore, and that 1st and 2nd transaction have been forged
*/

module.exports = {
    events: {
        newBlock: {
            5: [ '0.transfer-new-wallet.action' ],
            21: [ '1.create-transactions.action' ],
            23: [ '2.check-unconfirmed.test' ],
            25: [ '3.stop-node.action' ],
            28: [ '4.0.restart-node.action', '4.1.check-tx-1.test' ],
            50: [ '5.check-node-pool.test' ]
        }
    }
}