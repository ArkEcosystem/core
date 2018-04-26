const Block = require('../../lib/models/block')

describe('Models - Block', () => {
  describe('constructor', () => {
    it('stores the data', () => {})
    it('verifies the block', () => {})
  })

  describe('getHeader', () => {
    it('returns the block data without the transactions', () => {
      // Ignore the verification for testing purposes
      jest.spyOn(Block.prototype, 'verify').mockImplementation(() => ({ verified: true }))

      const data = {
        id: '9365419148238872318',
        blockSignature: '3045022100a6605198e0f590c88798405bc76748d84e280d179bcefed2c993e70cded2a5dd022008c7f915b89fc4f3250fc4b481abb753c68f30ac351871c50bd6cfaf151370e8', // eslint-disable-line max-len
        generatorPublicKey: '024c8247388a02ecd1de2a3e3fd5b7c61ecc2797fa3776599d558333ef1802d231',
        height: 10,
        numberOfTransactions: 0,
        payloadHash: '578e820911f24e039733b45e4882b73e301f813a0d2c31330dafda84534ffa23',
        payloadLength: 1,
        previousBlock: '12123',
        reward: 1,
        timestamp: 0,
        totalAmount: 10,
        totalFee: 1,
        transactions: [],
        version: 1
      }

      const block = new Block(data)

      Object.keys(data).forEach(key => {
        if (key !== 'transactions') {
          expect(block.getHeader()[key]).toBe(data[key])
        }
      })

      expect(block.getHeader()).not.toHaveProperty('transactions')
    })
  })
})
