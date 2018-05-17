'use strict'

const rule = require('../../../../lib/rules/models/transactions/vote')
const { transactionBuilder } = require('@arkecosystem/client')
const arktoshi = Math.pow(10, 8)
const vote = '+02bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9'
const unvote = '-0326580718fc86ba609799ac95fcd2721af259beb5afa81bfce0ab7d9fe95de991'
const votes = [
  vote,
  '+0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0',
  unvote
]
const invalidVotes = [
  '02bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9',
  '0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0',
  '0326580718fc86ba609799ac95fcd2721af259beb5afa81bfce0ab7d9fe95de991'
]

let transaction
beforeEach(() => {
  transaction = transactionBuilder.vote()
})

describe('Vote Transaction Rule', () => {
  it('should be a function', () => {
    expect(rule).toBeFunction()
  })

  it('should be valid with 1 vote', () => {
    transaction.create([vote])
               .sign('passphrase')
    expect(rule(transaction.getStruct()).fails).toBeFalsy()
  })

  it('should be valid with 1 unvote', () => {
    transaction.create([unvote])
               .sign('passphrase')
    expect(rule(transaction.getStruct()).fails).toBeFalsy()
  })

  it('should be valid', () => {
    transaction.create(votes)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).fails).toBeFalsy()
  })

  it('should be invalid due to no transaction as object', () => {
    expect(rule('test').passes).toBeFalsy()
  })

  it('should be invalid due to non-zero amount', () => {
    transaction.create(votes)
               .setAmount(10 * arktoshi)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })

  it('should be invalid due to zero fee', () => {
    transaction.create(votes)
               .setFee(0)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })

  it('should be invalid due to no votes', () => {
    transaction.create([])
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })

  xit('should be invalid due to too many votes', () => {
    transaction.create(votes)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })

  it('should be invalid due to invalid votes', () => {
    transaction.create(invalidVotes)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })

  it('should be invalid due to wrong transaction type', () => {
    transaction = transactionBuilder.delegateRegistration()
    transaction.create('delegate_name')
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })
})
