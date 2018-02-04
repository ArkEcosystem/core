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

let offsetTimestamp = 0

describe('API 1.0 - Transactions', () => {
  describe('GET /api/transactions', () => {
    it('should be ok using valid parameters', (done) => {
      utils.request('GET', 'transactions', {
        'blockId': '9635341524063110283',
        'senderId': Address1,
        'recipientId': Address2,
        'limit': 10,
        'offset': 0,
        'orderBy': 'amount:asc'
      }).end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(Array.isArray(res.body.transactions)).toBe(true)

        done()
      })
    })

    it('should be ok using type', (done) => {
      const type = 1

      utils.request('GET', 'transactions', {type}).end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(Array.isArray(res.body.transactions)).toBe(true)

        for (let i = 0; i < res.body.transactions.length; i++) {
          if (res.body.transactions[i]) {
            expect(res.body.transactions[i]).toHaveProperty('type', type)
          }
        }

        done()
      })
    })

    it('should be ok using no params', (done) => {
      utils.request('GET', 'transactions').end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(Array.isArray(res.body.transactions)).toBe(true)

        for (let i = 0; i < res.body.transactions.length - 1; i++) {
          expect(res.body.transactions[i].amount).toBeType('number')
        }

        done()
      })
    })

    // fixquery
    // http://localhost:4003/api/transactions?orderBy=timestamp:desc&offset=0&limit=50&recipientId=ANwZGjK55pe4xSWfnggt324S9XKY3TSwAr&senderId=ANwZGjK55pe4xSWfnggt324S9XKY3TSwAr

    it('should fail using limit > 100', (done) => {
      let limit = 101
      let params = 'limit=' + limit

      utils.request('GET', 'transactions?' + params).end((err, res) => {
        utils.assertError(err, res)

        expect(res.body.error).toBeType('string')
        done()
      })
    })

    it('should be ok ordered by ascending timestamp', (done) => {
      utils.request('GET', 'transactions', { orderBy: 'timestamp:asc' }).end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(Array.isArray(res.body.transactions)).toBe(true)

        let flag = 0;
        for (let i = 0; i < res.body.transactions.length; i++) {
          if (res.body.transactions[i + 1]) {
            // res.body.transactions[i].toHaveProperty('timestamp').which.is.at.most(res.body.transactions[i + 1].timestamp)
            expect(res.body.transactions[i]).toHaveProperty('timestamp')

            if (flag === 0) {
              // offsetTimestamp = res.body.transactions[i + 1].timestamp
              flag = 1
            }
          }
        }

        done()
      })
    })

    it('should be ok using offset == 1', (done) => {
      utils.request('GET', 'transactions', { offset: 1 }).end((err, res) => {
          utils.assertSuccessful(err, res)

          expect(Array.isArray(res.body.transactions)).toBe(true)

          done()
        })
    })

    it('should fail using offset == "one"', (done) => {
      utils.request('GET', 'transactions', { offset: 'one' }).end((err, res) => {
        utils.assertError(err, res)

        expect(res.body.error).toBeType('string')
        done()
      })
    })

    it('should fail using completely invalid fields', (done) => {
      utils.request('GET', 'transactions', {
        blockId: 'invalid',
        senderId: 'invalid',
        recipientId: 'invalid',
        limit: 'invalid',
        offset: 'invalid',
        orderBy: 'invalid'
      }).end((err, res) => {
        utils.assertError(err, res)

        expect(res.body.error).toBeType('string')
        done()
      })
    })

    it('should fail using partially invalid fields', (done) => {
      utils.request('GET', 'transactions', {
        blockId: 'invalid',
        senderId: 'invalid',
        recipientId: Address1,
        limit: 'invalid',
        offset: 'invalid',
        orderBy: 'invalid'
      }).end((err, res) => {
        utils.assertError(err, res)

        expect(res.body.error).toBeType('string')
        done()
      })
    })
  })

  describe('GET /api/transactions/get?id=3fd7fa4fda1ae97055996040b482efa81f420516fadf50cff508da2025e9b8b9', () => {
    it('should be ok using valid id', (done) => {
      let transactionInCheck = transactionList[0]

      utils.request('GET', `transactions/get?id=${transactionInCheck.id}`).end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(res.body.transaction).toBeType('object')
        expect(res.body.transaction).toHaveProperty('id', transactionInCheck.id)
        // expect(res.body.transaction).toHaveProperty('amount', transactionInCheck.netSent)
        // expect(res.body.transaction).toHaveProperty('fee', transactionInCheck.fee)
        expect(res.body.transaction).toHaveProperty('recipientId', transactionInCheck.recipientId)
        expect(res.body.transaction).toHaveProperty('senderId', transactionInCheck.senderId)
        expect(res.body.transaction).toHaveProperty('type', transactionInCheck.type)

        done()
      })
    })

    it('should fail using invalid id', (done) => {
      let params = 'id=invalid';

      utils.request('GET', 'transactions/get?' + params).end((err, res) => {
        utils.assertError(err, res)

        expect(res.body.error).toBeType('string')
        done()
      })
    })
  })

  describe.skip('GET /api/transactions/unconfirmed/get?id=', () => {
    it('should be ok using valid id', (done) => {
      let params = 'id=' + transactionList[transactionList.length - 1].id

      utils.request('GET', 'transactions/unconfirmed/get?' + params).end((err, res) => {
        utils.assertSuccessful(err, res)

        if (res.body.success && res.body.transaction != null) {
          expect(res.body.transaction).toBeType('object')
          expect(res.body.transaction).toHaveProperty('id', transactionList[transactionList.length - 1].id)
        } else {
          expect(res.body.error).toBeType('string')
        }

        done()
      })
    })
  })

  describe.skip('GET /api/transactions/unconfirmed', () => {
    it('should be ok', (done) => {
      utils.request('GET', 'transactions/unconfirmed').end((err, res) => {
        utils.assertSuccessful(err, res)

        expect(Array.isArray(res.body.transactions)).toBe(true)

        done()
      })
    })
  })
})
