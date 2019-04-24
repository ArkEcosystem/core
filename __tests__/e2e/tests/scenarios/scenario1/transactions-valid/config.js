'use strict'

module.exports = {
    events: {
        newBlock: {
            13: [ '0.0.transfer-new-wallet.action' ],
            15: [ '0.1.init-2ndsig.action' ],
            19: [ '1.0.transaction.action',
                  '1.1.transaction2ndsig.action'
                ],
            22: [ '2.check-tx.test' ]
        }
    }
}