const Helpers = require('../helpers')

const transactionId = '1d151056a431f14909c9e9c7b11d6f40eb5fe01f07afa206e45c1cb4080a1e09'
const blockId = '15160252859890579479'
const type = 0
const wrongType = 3
const version = 1
const senderPublicKey = '030cf398655cc01d0425a615aceb6b6d2acad40eb7b42039826dbce98b20fd578f'
const senderAddress = 'DTywx2qNfefZZ2Z2bjbugQgUML7yhYEatX'
const recipientAddress = 'DKf1RUGCM3G3DxdE7V7DW7SFJ4Afmvb4YU'
const timestamp = 4517477
const timestampFrom = 4517476
const timestampTo = 4517478
const amount = 100000000
const amountFrom = 0
const amountTo = 200000000
const fee = 10000000
const feeFrom = 0
const feeTo = 20000000
const vendorFieldHex = '796f'

describe('API 2.0 - Transactions', () => {
  describe('GET /api/transactions', () => {
    it('should GET all the transactions', (done) => {
      Helpers.request('GET', 'transactions').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        Helpers.assertTransaction(res.body.data[0])

        done()
      })
    })
  })

  describe('GET /api/transactions/:id', () => {
    it('should GET a transaction by the given identifier', (done) => {
      Helpers.request('GET', `transactions/${transactionId}`).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertResource(res)

        const transaction = res.body.data
        Helpers.assertTransaction(transaction)
        expect(transaction.id).toBe(transactionId)

        done()
      })
    })
  })

  describe.skip('GET /api/transactions/unconfirmed', () => {
    it('should GET all the unconfirmed transactions', (done) => {
      Helpers.request('GET', 'transactions/unconfirmed').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        done()
      })
    })
  })

  describe.skip('GET /api/transactions/unconfirmed/:id', () => {
    it('should GET an unconfirmed transaction by the given identifier', (done) => {
      Helpers.request('GET', 'transactions/unconfirmed/:id').end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        done()
      })
    })
  })

  describe('POST /api/transactions/search', () => {
    it('should POST a search for transactions with the exact specified transactionId', (done) => {
      Helpers.request('POST', 'transactions/search', { id: transactionId }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const transaction = res.body.data[0]
        Helpers.assertTransaction(transaction)
        expect(transaction.id).toBe(transactionId)

        done()
      })
    })

    it('should POST a search for transactions with the exact specified blockId', (done) => {
      Helpers.request('POST', 'transactions/search', { id: transactionId, blockId }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const transaction = res.body.data[0]
        Helpers.assertTransaction(transaction)
        expect(transaction.id).toBe(transactionId)
        expect(transaction.block_id).toBe(blockId)

        done()
      })
    })

    it('should POST a search for transactions with the exact specified type', (done) => {
      Helpers.request('POST', 'transactions/search', { id: transactionId, type }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const transaction = res.body.data[0]
        Helpers.assertTransaction(transaction)
        expect(transaction.id).toBe(transactionId)
        expect(transaction.type).toBe(type)

        done()
      })
    })

    it('should POST a search for transactions with the exact specified version', (done) => {
      Helpers.request('POST', 'transactions/search', { id: transactionId, version }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const transaction = res.body.data[0]
        Helpers.assertTransaction(transaction)
        expect(transaction.id).toBe(transactionId)

        done()
      })
    })

    it('should POST a search for transactions with the exact specified senderPublicKey', (done) => {
      Helpers.request('POST', 'transactions/search', { id: transactionId, senderPublicKey }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const transaction = res.body.data[0]
        Helpers.assertTransaction(transaction)
        expect(transaction.id).toBe(transactionId)
        expect(transaction.sender).toBe(senderAddress)

        done()
      })
    })

    it('should POST a search for transactions with the exact specified recipientId (Address)', (done) => {
      Helpers.request('POST', 'transactions/search', { id: transactionId, recipientId: recipientAddress }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const transaction = res.body.data[0]
        Helpers.assertTransaction(transaction)
        expect(transaction.id).toBe(transactionId)
        expect(transaction.recipient).toBe(recipientAddress)

        done()
      })
    })

    it('should POST a search for transactions with the exact specified timestamp', (done) => {
      Helpers.request('POST', 'transactions/search', { id: transactionId, timestamp }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const transaction = res.body.data[0]
        Helpers.assertTransaction(transaction)
        expect(transaction.id).toBe(transactionId)

        done()
      })
    })

    it('should POST a search for transactions with the specified timestamp range', (done) => {
      Helpers.request('POST', 'transactions/search', { id: transactionId, timestamp: { from: timestampFrom, to: timestampTo } }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const transaction = res.body.data[0]
        Helpers.assertTransaction(transaction)
        expect(transaction.id).toBe(transactionId)

        done()
      })
    })

    it('should POST a search for transactions with the exact specified amount', (done) => {
      Helpers.request('POST', 'transactions/search', { id: transactionId, amount }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const transaction = res.body.data[0]
        Helpers.assertTransaction(transaction)
        expect(transaction.id).toBe(transactionId)

        done()
      })
    })

    it('should POST a search for transactions with the specified amount range', (done) => {
      Helpers.request('POST', 'transactions/search', { id: transactionId, amount: { from: amountFrom, to: amountTo } }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const transaction = res.body.data[0]
        Helpers.assertTransaction(transaction)
        expect(transaction.id).toBe(transactionId)

        done()
      })
    })

    it('should POST a search for transactions with the exact specified fee', (done) => {
      Helpers.request('POST', 'transactions/search', { id: transactionId, fee }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const transaction = res.body.data[0]
        Helpers.assertTransaction(transaction)
        expect(transaction.id).toBe(transactionId)

        done()
      })
    })

    it('should POST a search for transactions with the specified fee range', (done) => {
      Helpers.request('POST', 'transactions/search', { id: transactionId, fee: { from: feeFrom, to: feeTo } }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const transaction = res.body.data[0]
        Helpers.assertTransaction(transaction)
        expect(transaction.id).toBe(transactionId)

        done()
      })
    })

    it.skip('should POST a search for transactions with the exact specified vendorFieldHex', (done) => {
      Helpers.request('POST', 'transactions/search', { id: transactionId, vendorFieldHex }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const transaction = res.body.data[0]
        Helpers.assertTransaction(transaction)
        expect(transaction.id).toBe(transactionId)

        done()
      })
    })

    it('should POST a search for transactions with the wrong specified type', (done) => {
      Helpers.request('POST', 'transactions/search', { id: transactionId, type: wrongType }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(0)

        done()
      })
    })

    it('should POST a search for transactions with the specific criteria', (done) => {
      Helpers.request('POST', 'transactions/search', {
        senderPublicKey: senderPublicKey,
        type: type,
        timestamp: {
          from: timestampFrom,
          to: timestampTo,
        }
      }).end((err, res) => {
        Helpers.assertSuccessful(err, res)
        Helpers.assertCollection(res)

        expect(res.body.data).toHaveLength(1)

        const transaction = res.body.data[0]
        Helpers.assertTransaction(transaction)
        expect(transaction.id).toBe(transactionId)

        done()
      })
    })
  })
})
