const chai = require('chai')
const { expect } = require('chai')

const Helpers = require('../helpers')
const base = 'http://localhost:4003'

const Address1 = 'DQUjMT6fhJWbwhaYL5pPdX9v5qPiRcAzRb'
const Address2 = 'DGihocTkwDygiFvmg6aG8jThYTic47GzU9'

let transactionList = [{
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

describe('GET /api/transactions', () => {
  it('using valid parameters should be ok', (done) => {
    let limit = 10;
    let offset = 0;
    let orderBy = 'amount:asc'

    let params = [
      'blockId=',
      'senderId=' + Address1,
      'recipientId=' + Address2,
      'limit=' + limit,
      'offset=' + offset,
      'orderBy=' + orderBy
    ]

    chai.request(base)
      .get('/api/transactions?' + params.join('&'))
      .set('Accept-Version', '1.0.0')
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, true)

        expect(res.body.transactions).that.is.an('array')

        done()
    })
  })

  it('using type should be ok', (done) => {
    let type = 1
    let params = 'type=' + type

    chai.request(base)
      .get('/api/transactions?' + params)
      .set('Accept-Version', '1.0.0')
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, true)

        expect(res.body.transactions).that.is.an('array')

        for (let i = 0; i < res.body.transactions.length; i++) {
          if (res.body.transactions[i]) {
            expect(res.body.transactions[i].type).to.equal(type)
          }
        }
        done()
    })
  })

  it('using no params should be ok', (done) => {
    chai.request(base)
      .get('/api/transactions')
      .set('Accept-Version', '1.0.0')
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, true)

        expect(res.body.transactions).that.is.an('array')

        for (let i = 0; i < res.body.transactions.length - 1; i++) {
          expect(res.body.transactions[i].amount).to.be.a('number')
        }

        transactionList = res.body.transactions

        done()
    })
  })

  // fixquery
  // http://localhost:4003/api/transactions?orderBy=timestamp:desc&offset=0&limit=50&recipientId=ANwZGjK55pe4xSWfnggt324S9XKY3TSwAr&senderId=ANwZGjK55pe4xSWfnggt324S9XKY3TSwAr

  it('using limit > 100 should fail', (done) => {
    let limit = 101
    let params = 'limit=' + limit

    chai.request(base)
      .get('/api/transactions?' + params)
      .set('Accept-Version', '1.0.0')
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, false)

        expect(res.body).to.have.property('error')

        done()
    })
  })

  it('ordered by ascending timestamp should be ok', (done) => {
    let orderBy = 'timestamp:asc';
    let params = 'orderBy=' + orderBy;

    chai.request(base)
      .get('/api/transactions?' + params)
      .set('Accept-Version', '1.0.0')
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, true)

        expect(res.body.transactions).that.is.an('array')

        let flag = 0;
        for (let i = 0; i < res.body.transactions.length; i++) {
          if (res.body.transactions[i + 1]) {
            expect(res.body.transactions[i].timestamp).to.be.at.most(res.body.transactions[i + 1].timestamp)

            if (flag === 0) {
              // offsetTimestamp = res.body.transactions[i + 1].timestamp
              flag = 1
            }
          }
        }

      done()
    })
  })

  it('using offset == 1 should be ok', (done) => {
    let offset = 1
    let params = 'offset=' + offset

    chai.request(base)
      .get('/api/transactions?' + params)
      .set('Accept-Version', '1.0.0')
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, true)

        expect(res.body.transactions).that.is.an('array')

        done()
      })
  })

  it('using offset == "one" should fail', (done) => {
    let offset = 'one';
    let params = 'offset=' + offset;

    chai.request(base)
      .get('/api/transactions?' + params)
      .set('Accept-Version', '1.0.0')
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, false)

        expect(res.body).to.have.property('error')

        done()
      })
  })

  it('using completely invalid fields should fail', (done) => {
    let params = [
      'blockId=invalid',
      'senderId=invalid',
      'recipientId=invalid',
      'limit=invalid',
      'offset=invalid',
      'orderBy=invalid'
    ]

    chai.request(base)
      .get('/api/transactions?' + params.join('&'))
      .set('Accept-Version', '1.0.0')
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, false)

        expect(res.body).to.have.property('error')

        done()
      })
  })

  it('using partially invalid fields should fail', (done) => {
    let params = [
      'blockId=invalid',
      'senderId=invalid',
      'recipientId=' + Address1,
      'limit=invalid',
      'offset=invalid',
      'orderBy=blockId:asc'
    ]

    chai.request(base)
      .get('/api/transactions?' + params.join('&'))
      .set('Accept-Version', '1.0.0')
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, false)

        expect(res.body).to.have.property('error')

        done()
      })
  })
})

describe('GET /api/transactions/get?id=3fd7fa4fda1ae97055996040b482efa81f420516fadf50cff508da2025e9b8b9', () => {
  it('using valid id should be ok', (done) => {
    let transactionInCheck = transactionList[0]

    chai.request(base)
      .get(`/api/transactions/get?id=${transactionInCheck.id}`)
      .set('Accept-Version', '1.0.0')
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, true)

        expect(res.body).to.have.property('transaction').that.is.an('object')
        expect(res.body.transaction.id).to.equal(transactionInCheck.id)
        // expect(res.body.transaction.amount / node.normalizer).to.equal(transactionInCheck.netSent)
        // expect(res.body.transaction.fee / node.normalizer).to.equal(transactionInCheck.fee)
        expect(res.body.transaction.recipientId).to.equal(transactionInCheck.recipientId)
        expect(res.body.transaction.senderId).to.equal(transactionInCheck.senderId)
        expect(res.body.transaction.type).to.equal(transactionInCheck.type)

        done()
    })
  })

  it('using invalid id should fail', (done) => {
    let params = 'id=invalid';

    chai.request(base)
      .get('/api/transactions/get?' + params)
      .set('Accept-Version', '1.0.0')
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, false)

        expect(res.body).to.have.property('error')

        done()
    })
  })
})

describe('GET /api/transactions/unconfirmed/get?id=', () => {
  it('using valid id should be ok', (done) => {
    let params = 'id=' + transactionList[transactionList.length - 1].txId

    chai.request(base)
      .get('/api/transactions/unconfirmed/get?' + params)
      .set('Accept-Version', '1.0.0')
      .end((err, res) => {
        Helpers.ValidateResponseStatus(err, res, 200, true)

        if (res.body.success && res.body.transaction != null) {
          expect(res.body).to.have.property('transaction').that.is.an('object')
          expect(res.body.transaction.id).to.equal(transactionList[transactionList.length - 1].txId)
      } else {
          expect(res.body).to.have.property('error')
      }
      done()
    })
  })
})

describe('GET /api/transactions/unconfirmed', () => {
  it('should be ok', (done) => {
    chai.request(base)
    .get('/api/transactions/unconfirmed')
      .set('Accept-Version', '1.0.0')
    .end((err, res) => {
      Helpers.ValidateResponseStatus(err, res, 200, true)

      expect(res.body.transactions).that.is.an('array')

      done()
    })
  })
})
