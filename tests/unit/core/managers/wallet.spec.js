const WalletManager = require('../../../app/core/managers/wallet')

describe('Core | WalletManager', () => {
  describe('reset', ()=> {
    it('', () => {
    })
  })

  describe('reindex', ()=> {
    it('indexes the wallet by address if it has one', () => {
    })
    it('indexes the wallet by public key if it has one', () => {
    })
    it('indexes the wallet (delegate) by username if it has one', () => {
    })
  })

  describe('applyBlock', ()=> {
    it('applies all the transactions on the block', () => {
    })

    it('applies the block to the delegate', () => {
    })

    describe('if 1 transaction fails while applying it', ()=> {
      it('undoes all the transactions of the block', () => {
      })
    })

    describe('when the delegate of the block is not indexed', ()=> {
      describe('unless is the first block', ()=> {
        it('throw an Error', () => {
        })
      })
      describe('if it is the first block', ()=> {
        it('generates a new wallet', () => {
        })
      })
    })
  })

  describe('undoBlock', ()=> {
    it('undoes all the transactions on the block', () => {
    })

    it('undoes the block to the delegate', () => {
    })


    // TODO
  })

  describe('applyTransaction', ()=> {
    // TODO
  })

  describe('undoTransaction', ()=> {
    // TODO
  })

  describe('getWalletByAddress', ()=> {
    describe('when the wallet is indexed by address already', ()=> {
      it('returns it', () => {
      })
    })

    describe('when the wallet is not indexed by address yet', ()=> {
      it('uses the address to infer it', () => {
      })

      it('indexes it by address', () => {
      })
    })

    describe('when the wallet is not indexed', ()=> {
      it('throw an error', () => {
      })
    })
  })

  describe('getWalletByPublicKey', ()=> {
    describe('when the wallet is indexed by public key already', ()=> {
      it('returns it', () => {
      })
    })

    describe('when the wallet is not indexed by public key yet', ()=> {
      it('uses the address to infer it', () => {
      })

      it('indexes it by public key', () => {
      })
    })

    describe('when the wallet is not indexed', ()=> {
      it('throw an error', () => {
      })
    })
  })

  describe('getDelegate', ()=> {
    it('returns the delegate of a specific username', () => {
      const manager = new WalletManager()
      manager.getDelegate()
      // expect()
    })
  })

  describe('getLocalWallets', ()=> {
    it('returns the wallets as an Array', () => {
      const manager = new WalletManager()
      manager.getLocalWallets()
    })
  })
})
