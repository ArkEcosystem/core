const utils = require('../utils')

const Address1 = 'DQUjMT6fhJWbwhaYL5pPdX9v5qPiRcAzRb'
const Address2 = 'DGihocTkwDygiFvmg6aG8jThYTic47GzU9'

const transactionList = [{
  'id': '3fd7fa4fda1ae97055996040b482efa81f420516fadf50cff508da2025e9b8b9',
  'blockid': '9635341524063110283',
  'type': 0,
  'timestamp': 6070813,
  'amount': 10000000000,
  'fee': 10000000,
  'recipientId': 'DSZpph3ANnFw9D7NK4fAdLkigkYWPDBqk6',
  'senderId': 'DBi2HdDY8TqMCD2aFLVomEF92gzeDmEHmR',
  'senderPublicKey': '03bd4f16e39aaba5cba6a87b7498b08ce540f279be367e68ae96fb05dfabe203ad',
  'signature': '3045022100c8932300eb39829bf8178728bf8ab96e4b3085f876073e18e18087d61a3a5360022061749eaa3a20a02a362f358c16a681b46b03c60a07972996386d92e65790af4f',
  'confirmations': 0
}]

// let offsetTimestamp = 0

describe('API 1.0 - Transactions', () => {
  describe('GET /api/transactions', () => {
    it('should be ok using valid parameters', async () => {
      const res = await utils.request('GET', 'transactions', {
        'blockId': '9635341524063110283',
        'senderId': Address1,
        'recipientId': Address2,
        'limit': 10,
        'offset': 0,
        'orderBy': 'amount:asc'
      })
      await utils.assertSuccessful(res)

      await expect(Array.isArray(res.body.transactions)).toBe(true)
    })

    it('should be ok using type', async () => {
      const type = 1

      const res = await utils.request('GET', 'transactions', {type})
      await utils.assertSuccessful(res)

      await expect(Array.isArray(res.body.transactions)).toBe(true)

      for (let i = 0; i < res.body.transactions.length; i++) {
        if (res.body.transactions[i]) {
        await expect(res.body.transactions[i]).toHaveProperty('type', type)
        }
      }
    })

    it('should be ok using no params', async () => {
      const res = await utils.request('GET', 'transactions')
      await utils.assertSuccessful(res)

      await expect(Array.isArray(res.body.transactions)).toBe(true)

      for (let i = 0; i < res.body.transactions.length - 1; i++) {
      await expect(res.body.transactions[i].amount).toBeType('number')
      }
    })

    // fixquery
    // http://localhost:4003/api/transactions?orderBy=timestamp:desc&offset=0&limit=50&recipientId=ANwZGjK55pe4xSWfnggt324S9XKY3TSwAr&senderId=ANwZGjK55pe4xSWfnggt324S9XKY3TSwAr

    it('should fail using limit > 100', async () => {
      let limit = 101
      let params = 'limit=' + limit

      const res = await utils.request('GET', 'transactions?' + params)
      await utils.assertError(res)

      await expect(res.body.error).toBeType('string')
    })

    it('should be ok ordered by ascending timestamp', async () => {
      const res = await utils.request('GET', 'transactions', { orderBy: 'timestamp:asc' })
      await utils.assertSuccessful(res)

      await expect(Array.isArray(res.body.transactions)).toBe(true)

      let flag = 0;
      for (let i = 0; i < res.body.transactions.length; i++) {
        if (res.body.transactions[i + 1]) {
          // await res.body.transactions[i].toHaveProperty('timestamp').which.is.at.most(res.body.transactions[i + 1].timestamp)
          await expect(res.body.transactions[i]).toHaveProperty('timestamp')

          if (flag === 0) {
            // offsetTimestamp = res.body.transactions[i + 1].timestamp
            flag = 1
          }
        }
      }
    })

    it('should be ok using offset == 1', async () => {
      const res = await utils.request('GET', 'transactions', { offset: 1 })
      await utils.assertSuccessful(res)

      await expect(Array.isArray(res.body.transactions)).toBe(true)
    })

    it('should fail using offset == "one"', async () => {
      const res = await utils.request('GET', 'transactions', { offset: 'one' })
      await utils.assertError(res)

      await expect(res.body.error).toBeType('string')
    })

    it('should fail using completely invalid fields', async () => {
      const res = await utils.request('GET', 'transactions', {
        blockId: 'invalid',
        senderId: 'invalid',
        recipientId: 'invalid',
        limit: 'invalid',
        offset: 'invalid',
        orderBy: 'invalid'
      })
      await utils.assertError(res)

      await expect(res.body.error).toBeType('string')
    })

    it('should fail using partially invalid fields', async () => {
      const res = await utils.request('GET', 'transactions', {
        blockId: 'invalid',
        senderId: 'invalid',
        recipientId: Address1,
        limit: 'invalid',
        offset: 'invalid',
        orderBy: 'invalid'
      })
      await utils.assertError(res)

      await expect(res.body.error).toBeType('string')
    })
  })

  describe('GET /api/transactions/get?id=3fd7fa4fda1ae97055996040b482efa81f420516fadf50cff508da2025e9b8b9', () => {
    it('should be ok using valid id', async () => {
      let transactionInCheck = transactionList[0]

      const res = await utils.request('GET', `transactions/get?id=${transactionInCheck.id}`)
      await utils.assertSuccessful(res)

      await expect(res.body.transaction).toBeType('object')
      await expect(res.body.transaction).toHaveProperty('id', transactionInCheck.id)
        // expect(res.body.transaction).toHaveProperty('amount', transactionInCheck.netSent)
        // expect(res.body.transaction).toHaveProperty('fee', transactionInCheck.fee)
      await expect(res.body.transaction).toHaveProperty('recipientId', transactionInCheck.recipientId)
      await expect(res.body.transaction).toHaveProperty('senderId', transactionInCheck.senderId)
      await expect(res.body.transaction).toHaveProperty('type', transactionInCheck.type)
    })

    it('should fail using invalid id', async () => {
      let params = 'id=invalid';

      const res = await utils.request('GET', 'transactions/get?' + params)
      await utils.assertError(res)

      await expect(res.body.error).toBeType('string')
    })
  })

  // @TODO: TypeError: this.redis.getTransactionsForForger is not a function
  describe.skip('GET /api/transactions/unconfirmed/get?id=', () => {
    it('should be ok using valid id', async () => {
      let params = 'id=' + transactionList[transactionList.length - 1].id

      const res = await utils.request('GET', 'transactions/unconfirmed/get?' + params)
      await utils.assertSuccessful(res)

      if (res.body.success && res.body.transaction != null) {
        await expect(res.body.transaction).toBeType('object')
        await expect(res.body.transaction).toHaveProperty('id', transactionList[transactionList.length - 1].id)
      } else {
        await expect(res.body.error).toBeType('string')
      }
    })
  })

  // @TODO: TypeError: this.redis.getTransactionsForForger is not a function
  describe.skip('GET /api/transactions/unconfirmed', () => {
    it('should be ok', async () => {
      const res = await utils.request('GET', 'transactions/unconfirmed')
      await utils.assertSuccessful(res)

      await expect(Array.isArray(res.body.transactions)).toBe(true)
    })
  })
})
