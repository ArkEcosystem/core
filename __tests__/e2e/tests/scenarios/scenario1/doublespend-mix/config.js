'use strict'

module.exports = {
    events: {
        newBlock: {
            5: [ '0.0.transfer-new-wallet.action' ],
            9: [ '0.1.init-2ndsig.action' ],
            15: [ '1.0.doublespend.action',
                  '1.1.doublespend2ndsig.action'
                ],
            20: [ '2.check-tx.test' ]
        }
    }
}