'use strict'

const rule = require('../../../../../lib/validation/rules/models/transactions/vote')
const { constants, transactionBuilder } = require('../../../../../lib')
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
    transaction.votesAsset([vote])

      .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).toBeNull()
  })

  it('should be valid with 1 unvote', () => {
    transaction.votesAsset([unvote])
      .sign('passphrase')

    expect(rule(transaction.getStruct()).errors).toBeNull()
  })

  it('should be invalid due to no transaction as object', () => {
    expect(rule('test').errors).not.toBeNull()
  })

  it('should be invalid due to non-zero amount', () => {
    transaction.votesAsset(votes)
      .amount(10 * constants.ARKTOSHI)
      .sign('passphrase')

    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to zero fee', () => {
    transaction.votesAsset(votes)
      .fee(0)
      .sign('passphrase')

    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to no votes', () => {
    transaction.votesAsset([])
      .sign('passphrase')

    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to more than 1 vote', () => {
    transaction.votesAsset(votes)
      .sign('passphrase')

    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to invalid votes', () => {
    transaction.votesAsset(invalidVotes)
      .sign('passphrase')

    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to wrong vote type', () => {
    try {
      transaction.votesAsset(vote)
        .sign('passphrase')
      expect(rule(transaction.getStruct()).errors).not.toBeNull()
    } catch (error) {
    }
  })

  it('should be invalid due to wrong transaction type', () => {
    transaction = transactionBuilder.delegateRegistration()
    transaction.usernameAsset('delegate_name')
      .sign('passphrase')

    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })
})
