const Helpers = require('../helpers')

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
      Helpers.request('GET', 'transactions', {
        'blockId': null,
        'senderId': Address1,
        'recipientId': Address2,
        'limit': 10,
        'offset': 0,
        'orderBy': 'amount:asc'
      }).end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('transactions').which.is.an('array')

        done()
      })
    })

    it('should be ok using type', (done) => {
      const type = 1

      Helpers.request('GET', 'transactions', {type}).end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('transactions').which.is.an('array')

        for (let i = 0; i < res.body.transactions.length; i++) {
          if (res.body.transactions[i]) {
            res.body.transactions[i].should.have.property('type').which.equals(type)
          }
        }

        done()
      })
    })

    it('should be ok using no params', (done) => {
      Helpers.request('GET', 'transactions').end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('transactions').which.is.an('array')

        for (let i = 0; i < res.body.transactions.length - 1; i++) {
          res.body.transactions[i].should.have.property('amount').which.is.a('number')
        }

        done()
      })
    })

    // fixquery
    // http://localhost:4003/api/transactions?orderBy=timestamp:desc&offset=0&limit=50&recipientId=ANwZGjK55pe4xSWfnggt324S9XKY3TSwAr&senderId=ANwZGjK55pe4xSWfnggt324S9XKY3TSwAr

    it('should fail using limit > 100', (done) => {
      let limit = 101
      let params = 'limit=' + limit

      Helpers.request('GET', 'transactions?' + params).end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('error')

        done()
      })
    })

    it('should be ok ordered by ascending timestamp', (done) => {
      Helpers.request('GET', 'transactions', { orderBy: 'timestamp:asc' }).end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('transactions').which.is.an('array')

        let flag = 0;
        for (let i = 0; i < res.body.transactions.length; i++) {
          if (res.body.transactions[i + 1]) {
            res.body.transactions[i].should.have.property('timestamp').which.is.at.most(res.body.transactions[i + 1].timestamp)

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
      Helpers.request('GET', 'transactions', { offset: 1 }).end((err, res) => {
          Helpers.assertSuccessful(err, res)

          res.body.should.have.property('transactions').which.is.an('array')

          done()
        })
    })

    it('should fail using offset == "one"', (done) => {
      Helpers.request('GET', 'transactions', { offset: 'one' }).end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('error')

        done()
      })
    })

    it('should fail using completely invalid fields', (done) => {
      Helpers.request('GET', 'transactions', {
        blockId: 'invalid',
        senderId: 'invalid',
        recipientId: 'invalid',
        limit: 'invalid',
        offset: 'invalid',
        orderBy: 'invalid'
      }).end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('error')

        done()
      })
    })

    it('should fail using partially invalid fields', (done) => {
      Helpers.request('GET', 'transactions', {
        blockId: 'invalid',
        senderId: 'invalid',
        recipientId: Address1,
        limit: 'invalid',
        offset: 'invalid',
        orderBy: 'invalid'
      }).end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('error')

        done()
      })
    })
  })

  describe('GET /api/transactions/get?id=3fd7fa4fda1ae97055996040b482efa81f420516fadf50cff508da2025e9b8b9', () => {
    it('should be ok using valid id', (done) => {
      let transactionInCheck = transactionList[0]

      Helpers.request('GET', `transactions/get?id=${transactionInCheck.id}`).end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('transaction').which.is.an('object')
        res.body.transaction.should.have.property('id').which.equals(transactionInCheck.id)
        // res.body.transaction.should.have.property('amount').which.equals(transactionInCheck.netSent)
        // res.body.transaction.should.have.property('fee').which.equals(transactionInCheck.fee)
        res.body.transaction.should.have.property('recipientId').which.equals(transactionInCheck.recipientId)
        res.body.transaction.should.have.property('senderId').which.equals(transactionInCheck.senderId)
        res.body.transaction.should.have.property('type').which.equals(transactionInCheck.type)

        done()
      })
    })

    it('should fail using invalid id', (done) => {
      let params = 'id=invalid';

      Helpers.request('GET', 'transactions/get?' + params).end((err, res) => {
        Helpers.assertError(err, res)

        res.body.should.have.property('error')

        done()
      })
    })
  })

  describe.skip('GET /api/transactions/unconfirmed/get?id=', () => {
    it('should be ok using valid id', (done) => {
      let params = 'id=' + transactionList[transactionList.length - 1].id

      Helpers.request('GET', 'transactions/unconfirmed/get?' + params).end((err, res) => {
        Helpers.assertSuccessful(err, res)

        if (res.body.success && res.body.transaction != null) {
          res.body.should.have.property('transaction').which.is.an('object')
          res.body.transaction.should.have.property('id').which.equals(transactionList[transactionList.length - 1].id)
        } else {
          res.body.should.have.property('error')
        }

        done()
      })
    })
  })

  describe.skip('GET /api/transactions/unconfirmed', () => {
    it('should be ok', (done) => {
      Helpers.request('GET', 'transactions/unconfirmed').end((err, res) => {
        Helpers.assertSuccessful(err, res)

        res.body.should.have.property('transactions').which.is.an('array')

        done()
      })
    })
  })
})
