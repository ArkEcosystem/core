const utils = require('../utils')

const transactionId = '1d151056a431f14909c9e9c7b11d6f40eb5fe01f07afa206e45c1cb4080a1e09'
const blockId = '15160252859890579479'
const type = 0
const wrongType = 3
const version = 1
const senderPublicKey = '030cf398655cc01d0425a615aceb6b6d2acad40eb7b42039826dbce98b20fd578f'
const senderAddress = 'DTywx2qNfefZZ2Z2bjbugQgUML7yhYEatX'
const recipientAddress = 'DKf1RUGCM3G3DxdE7V7DW7SFJ4Afmvb4YU'
const timestamp = 4517888
const timestampFrom = 4517888
const timestampTo = 4517888
const amount = 100000000
const amountFrom = 0
const amountTo = 200000000
const fee = 10000000
const feeFrom = 0
const feeTo = 20000000

describe('API 2.0 - Transactions', () => {
  describe('GET /api/transactions', () => {
    it('should GET all the transactions', async () => {
      const res = await utils.request('GET', 'transactions')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await utils.assertTransaction(res.body.data[0])
    })
  })

  describe('GET /api/transactions/:id', () => {
    it('should GET a transaction by the given identifier', async () => {
      const res = await utils.request('GET', `transactions/${transactionId}`)
      await utils.assertSuccessful(res)
      await utils.assertResource(res)

      const transaction = res.body.data
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })
  })

  // @TODO: TypeError: this.redis.getTransactionsForForger is not a function
  describe.skip('GET /api/transactions/unconfirmed', () => {
    it('should GET all the unconfirmed transactions', async () => {
      const res = await utils.request('GET', 'transactions/unconfirmed')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)
    })
  })

  // @TODO: TypeError: this.redis.getTransactionsForForger is not a function
  describe.skip('GET /api/transactions/unconfirmed/:id', () => {
    it('should GET an unconfirmed transaction by the given identifier', async () => {
      const res = await utils.request('GET', 'transactions/unconfirmed/:id')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)
    })
  })

  describe('POST /api/transactions/search', () => {
    it('should POST a search for transactions with the exact specified transactionId', async () => {
      const res = await utils.request('POST', 'transactions/search', { id: transactionId })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it('should POST a search for transactions with the exact specified blockId', async () => {
      const res = await utils.request('POST', 'transactions/search', { id: transactionId, blockId })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
      await expect(transaction.blockId).toBe(blockId)
    })

    it('should POST a search for transactions with the exact specified type', async () => {
      const res = await utils.request('POST', 'transactions/search', { id: transactionId, type })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
      await expect(transaction.type).toBe(type)
    })

    it('should POST a search for transactions with the exact specified version', async () => {
      const res = await utils.request('POST', 'transactions/search', { id: transactionId, version })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it('should POST a search for transactions with the exact specified senderPublicKey', async () => {
      const res = await utils.request('POST', 'transactions/search', { id: transactionId, senderPublicKey })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
      await expect(transaction.sender).toBe(senderAddress)
    })

    it('should POST a search for transactions with the exact specified recipientId (Address)', async () => {
      const res = await utils.request('POST', 'transactions/search', { id: transactionId, recipientId: recipientAddress })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
      await expect(transaction.recipient).toBe(recipientAddress)
    })

    it('should POST a search for transactions with the exact specified timestamp', async () => {
      const res = await utils.request('POST', 'transactions/search', {
        id: transactionId,
        timestamp: {
          from: timestamp,
          to: timestamp
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it('should POST a search for transactions with the specified timestamp range', async () => {
      const res = await utils.request('POST', 'transactions/search', {
        id: transactionId,
        timestamp: {
          from: timestampFrom,
          to: timestampTo
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it('should POST a search for transactions with the exact specified amount', async () => {
      const res = await utils.request('POST', 'transactions/search', {
        id: transactionId,
        amount: {
          from: amount,
          to: amount
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it('should POST a search for transactions with the specified amount range', async () => {
      const res = await utils.request('POST', 'transactions/search', {
        id: transactionId,
        amount: {
          from: amountFrom,
          to: amountTo
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it('should POST a search for transactions with the exact specified fee', async () => {
      const res = await utils.request('POST', 'transactions/search', {
        id: transactionId,
        fee: {
          from: fee,
          to: fee
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it('should POST a search for transactions with the specified fee range', async () => {
      const res = await utils.request('POST', 'transactions/search', {
        id: transactionId,
        fee: {
          from: feeFrom,
          to: feeTo
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it('should POST a search for transactions with the exact specified vendorFieldHex', async () => {
      const transactionId = '0000faa27b422f7648b1a2f634f15c7e5c8e96b84929624fda44abf716bdf784'
      const vendorFieldHex = '64656c65676174653a20766f746572732073686172652e205468616e6b20796f7521207c74782062792061726b2d676f'

      const res = await utils.request('POST', 'transactions/search', { id: transactionId, vendorFieldHex })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it('should POST a search for transactions with the wrong specified type', async () => {
      const res = await utils.request('POST', 'transactions/search', { id: transactionId, type: wrongType })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(0)
    })

    it('should POST a search for transactions with the specific criteria', async () => {
      const res = await utils.request('POST', 'transactions/search', {
        senderPublicKey,
        type,
        timestamp: {
          from: timestampFrom,
          to: timestampTo
        }
      })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })
  })
})
