const utils = require('../utils')

const transactionId = '77229b181e3f06218a35854cc7cfad3b4bc5b3036defc6186467c3608cb4bd67'
const blockId = '15319587314238821909'
const type = 0
const wrongType = 3
const version = 1
const senderPublicKey = '031f3dffe4d10f78d85806d6b46f9c9a116e1aa56e8c538da2e02a416ff654b1db'
const senderAddress = 'DEig5G83hAFgcmNXtpFQVoVAoexeMdKQ2E'
const recipientAddress = 'DEig5G83hAFgcmNXtpFQVoVAoexeMdKQ2E'
const timestamp = 29782480
const timestampFrom = 29782480
const timestampTo = 29782552
const amount = 100000000
const amountFrom = 0
const amountTo = 200000000
const fee = 10000000
const feeFrom = 0
const feeTo = 20000000
const vendorFieldHex = '66617374'

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

  describe.skip('GET /api/transactions/unconfirmed', () => {
    it('should GET all the unconfirmed transactions', async () => {
      const res = await utils.request('GET', 'transactions/unconfirmed')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)
    })
  })

  describe.skip('GET /api/transactions/unconfirmed/:id', () => {
    it('should GET an unconfirmed transaction by the given identifier', async () => {
      const res = await utils.request('GET', 'transactions/unconfirmed/:id')
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)
    })
  })

  describe('GET /api/transactions/search', () => {
    it('should GET a search for transactions with the exact specified transactionId', async () => {
      const res = await utils.request('GET', 'transactions/search', { id: transactionId })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it('should GET a search for transactions with the exact specified blockId', async () => {
      const res = await utils.request('GET', 'transactions/search', { id: transactionId, blockId })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
      await expect(transaction.blockId).toBe(blockId)
    })

    it('should GET a search for transactions with the exact specified type', async () => {
      const res = await utils.request('GET', 'transactions/search', { id: transactionId, type })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
      await expect(transaction.type).toBe(type)
    })

    it('should GET a search for transactions with the exact specified version', async () => {
      const res = await utils.request('GET', 'transactions/search', { id: transactionId, version })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it('should GET a search for transactions with the exact specified senderPublicKey', async () => {
      const res = await utils.request('GET', 'transactions/search', { id: transactionId, senderPublicKey })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
      await expect(transaction.sender).toBe(senderAddress)
    })

    it('should GET a search for transactions with the exact specified recipientId (Address)', async () => {
      const res = await utils.request('GET', 'transactions/search', { id: transactionId, recipientId: recipientAddress })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
      await expect(transaction.recipient).toBe(recipientAddress)
    })

    it('should GET a search for transactions with the exact specified timestamp', async () => {
      const res = await utils.request('GET', 'transactions/search', { id: transactionId, timestamp })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it('should GET a search for transactions with the specified timestamp range', async () => {
      const res = await utils.request('GET', 'transactions/search', { id: transactionId, timestampFrom, timestampTo })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it('should GET a search for transactions with the exact specified amount', async () => {
      const res = await utils.request('GET', 'transactions/search', { id: transactionId, amount })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it('should GET a search for transactions with the specified amount range', async () => {
      const res = await utils.request('GET', 'transactions/search', { id: transactionId, amountFrom, amountTo })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it('should GET a search for transactions with the exact specified fee', async () => {
      const res = await utils.request('GET', 'transactions/search', { id: transactionId, fee })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it('should GET a search for transactions with the specified fee range', async () => {
      const res = await utils.request('GET', 'transactions/search', { id: transactionId, feeFrom, feeTo })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it.skip('should GET a search for transactions with the exact specified vendorFieldHex', async () => {
      const res = await utils.request('GET', 'transactions/search', { id: transactionId, vendorFieldHex })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(1)

      const transaction = res.body.data[0]
      await utils.assertTransaction(transaction)
      await expect(transaction.id).toBe(transactionId)
    })

    it('should GET a search for transactions with the wrong specified type', async () => {
      const res = await utils.request('GET', 'transactions/search', { id: transactionId, type: wrongType })
      await utils.assertSuccessful(res)
      await utils.assertCollection(res)

      await expect(res.body.data).toHaveLength(0)
    })

    it('should GET a search for transactions with the specific criteria', async () => {
      const res = await utils.request('GET', 'transactions/search', {
        id: transactionId,
        senderPublicKey,
        type,
        blockId,
        amount,
        timestampFrom,
        timestampTo
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
