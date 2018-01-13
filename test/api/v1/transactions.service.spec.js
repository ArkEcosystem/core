const chai = require('chai')
const { expect } = require('chai')
const config = require('../../../core/config')
const blockchain = requireFrom('core/blockchainManager')

const Helpers = require('../helpers')
const base = 'http://localhost:4003'

const Address1 = 'DQUjMT6fhJWbwhaYL5pPdX9v5qPiRcAzRb'
const Address2 = 'DGihocTkwDygiFvmg6aG8jThYTic47GzU9'


let transactionList = []
let offsetTimestamp = 0


describe('GET /api/transactions',  () => {

  it('using valid parameters should be ok',  (done) => {

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
      .get('/api/transactions?' + params.join('&'), (err, res)  => {
        Helpers.ValidateResponseStatus(err,res,200,true)

        expect(res.body.transactions).that.is.an('array')

        done()
      })
  })

  it('using type should be ok',  (done) => {
    let type = 1
    let params = 'type=' + type

    chai.request(base)
      .get('/api/transactions?' + params, (err, res)  => {
        Helpers.ValidateResponseStatus(err,res,200,true)

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
      .get('/api/transactions', (err, res) => {
        Helpers.ValidateResponseStatus(err,res,200,true)

        expect(res.body.transactions).that.is.an('array')

        for (let i = 0; i < res.body.transactions.length; i++) {
          expect(res.body.transactions[i].amount).to.be.a.number
        }

        transactionList = res.body.transactions

        done()
    })
  })

  it('using limit > 100 should fail', (done) => {
    let limit = 101
    let params = 'limit=' + limit

    chai.request(base)
      .get('/api/transactions?' + params,  (err, res) => {
        Helpers.ValidateResponseStatus(err,res,200,false)

        expect(res.body).to.have.property('error')

        done()
    })
  })

  it('ordered by ascending timestamp should be ok', (done) => {
    let orderBy = 'timestamp:asc';
    let params = 'orderBy=' + orderBy;

    chai.request(base)
      .get('/api/transactions?' + params, (err, res) => {
        Helpers.ValidateResponseStatus(err,res,200,true)

        expect(res.body.transactions).that.is.an('array')

        let flag = 0;
        for (let i = 0; i < res.body.transactions.length; i++) {
          if (res.body.transactions[i + 1]) {
            expect(res.body.transactions[i].timestamp).to.be.at.most(res.body.transactions[i + 1].timestamp)

            if (flag === 0) {
              offsetTimestamp = res.body.transactions[i + 1].timestamp
              flag = 1
            }
          }
        }

      done()
    })
  })

  it('using offset == 1 should be ok',  (done) => {
    let offset = 1
    let params = 'offset=' + offset

    chai.request(base)
      .get('/api/transactions?' + params,  (err, res) => {
        Helpers.ValidateResponseStatus(err,res,200,true)

        expect(res.body).to.have.property('error')

        done()
      })
  })

  it('using offset == "one" should fail', (done) => {
    let offset = 'one';
    let params = 'offset=' + offset;

    chai.request(base)
      .get('/api/transactions?' + params,  (err, res) => {
        Helpers.ValidateResponseStatus(err,res,200,false)

        expect(res.body).to.have.property('error')

        done()
      })
  })

  it('using completely invalid fields should fail',  (done) => {
    let params = [
      'blockId=invalid',
      'senderId=invalid',
      'recipientId=invalid',
      'limit=invalid',
      'offset=invalid',
      'orderBy=invalid'
    ]

    chai.request(base)
      .get('/api/transactions?' + params.join('&'),  (err, res) => {
        Helpers.ValidateResponseStatus(err,res,200,false)

        expect(res.body).to.have.property('error')

        done()
      })
  })

  it('using partially invalid fields should fail',  (done) => {
    let params = [
      'blockId=invalid',
      'senderId=invalid',
      'recipientId=' + Address1,
      'limit=invalid',
      'offset=invalid',
      'orderBy=blockId:asc'
    ]

    chai.request(base)
      .get('/api/transactions?' + params.join('&'),  (err, res) => {
        Helpers.ValidateResponseStatus(err,res,200,false)

        expect(res.body).to.have.property('error')

        done()
      })
  })
})

describe('GET /api/transactions/get?id=', () => {

  it('using valid id should be ok',  (done) => {
    let transactionInCheck = transactionList[0]
    let params = 'id=' + transactionInCheck.txId

    chai.request(base)
      .get('/api/transactions/get?' + params, (err, res)  => {
        Helpers.ValidateResponseStatus(err,res,200,true)

        expect(res.body).to.have.property('transaction').that.is.an('object')
        expect(res.body.transaction.id).to.equal(transactionInCheck.txId)
        //expect(res.body.transaction.amount / node.normalizer).to.equal(transactionInCheck.netSent)
        //expect(res.body.transaction.fee / node.normalizer).to.equal(transactionInCheck.fee)
        expect(res.body.transaction.recipientId).to.equal(transactionInCheck.recipient)
        expect(res.body.transaction.senderId).to.equal(transactionInCheck.sender)
        expect(res.body.transaction.type).to.equal(transactionInCheck.type)

      done()
    })
  })

  it('using invalid id should fail',  (done) => {
    let params = 'id=invalid';

    chai.request(base)
      .get('/api/transactions/get?' + params, (err, res) => {
        Helpers.ValidateResponseStatus(err,res,200,false)

        expect(res.body).to.have.property('error')

        done()
    })
  })
})

describe('GET /api/transactions/unconfirmed/get?id=', () => {

  it('using valid id should be ok',  (done) => {
    let params = 'id=' + transactionList[transactionList.length - 1].txId

    chai.request(base)
      .get('/api/transactions/unconfirmed/get?' + params, (err, res) => {
        Helpers.ValidateResponseStatus(err,res,200,true)

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

describe('GET /api/transactions/unconfirmed', function () {

  it('should be ok', function (done) {
    node.get('/api/transactions/unconfirmed', function (err, res) {
      node.expect(res.body).to.have.property('success').to.be.ok;
      node.expect(res.body).to.have.property('transactions').that.is.an('array');
      done();
    });
  });
});
