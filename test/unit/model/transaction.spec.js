const { expect } = require('chai')
const sinon = require('sinon')

const Transaction = require('model/transaction')

describe('Model | Transaction', ()=> {
  describe('static fromBytes', ()=> {
    it('returns a new transaction', function() {
      const hex = ''
      expect(Transaction.fromBytes(hex)).to.be.an.instanceof(Transaction)
    })
  })

  describe('static deserialize', ()=> {
  })

  describe('serialize', ()=> {
  })
})
