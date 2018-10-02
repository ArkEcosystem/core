'use strict'

const testSubject = require('../../lib/commands/deserialize')
const fixtureBlock = require('../__fixtures__/block.json')
const fixtureTransaction = require('../__fixtures__/transaction.json')

describe('Commands - Deserialize', () => {
  it('should be a function', () => {
    expect(testSubject).toBeFunction()
  })

  it('should deserialize a block (not-full)', () => {
    const actual = JSON.parse(testSubject({
      data: fixtureBlock.serialized,
      type: 'block'
    }))

    expect(actual.version).toBe(fixtureBlock.data.version)
    expect(actual.timestamp).toBe(fixtureBlock.data.timestamp)
    expect(actual.height).toBe(fixtureBlock.data.height)
    expect(actual.previousBlockHex).toBe(fixtureBlock.data.previousBlockHex)
    expect(actual.previousBlock).toBe(fixtureBlock.data.previousBlock)
    expect(actual.numberOfTransactions).toBe(fixtureBlock.data.numberOfTransactions)
    expect(actual.totalAmount).toBe(fixtureBlock.data.totalAmount)
    expect(actual.totalFee).toBe(fixtureBlock.data.totalFee)
    expect(actual.reward).toBe(fixtureBlock.data.reward)
    expect(actual.payloadLength).toBe(fixtureBlock.data.payloadLength)
    expect(actual.payloadHash).toBe(fixtureBlock.data.payloadHash)
    expect(actual.generatorPublicKey).toBe(fixtureBlock.data.generatorPublicKey)
    expect(actual.blockSignature).toBe(fixtureBlock.data.blockSignature)
  })

  it('should deserialize a block (full)', () => {
    const actual = JSON.parse(testSubject({
      data: fixtureBlock.serializedFull,
      type: 'block'
    }))

    expect(actual.version).toBe(fixtureBlock.data.version)
    expect(actual.timestamp).toBe(fixtureBlock.data.timestamp)
    expect(actual.height).toBe(fixtureBlock.data.height)
    expect(actual.previousBlockHex).toBe(fixtureBlock.data.previousBlockHex)
    expect(actual.previousBlock).toBe(fixtureBlock.data.previousBlock)
    expect(actual.numberOfTransactions).toBe(fixtureBlock.data.numberOfTransactions)
    expect(actual.totalAmount).toBe(fixtureBlock.data.totalAmount)
    expect(actual.totalFee).toBe(fixtureBlock.data.totalFee)
    expect(actual.reward).toBe(fixtureBlock.data.reward)
    expect(actual.payloadLength).toBe(fixtureBlock.data.payloadLength)
    expect(actual.payloadHash).toBe(fixtureBlock.data.payloadHash)
    expect(actual.generatorPublicKey).toBe(fixtureBlock.data.generatorPublicKey)
    expect(actual.blockSignature).toBe(fixtureBlock.data.blockSignature)
    expect(actual.transactions).toEqual(fixtureBlock.data.transactions)
  })

  it('should deserialize a transaction', () => {
    const actual = JSON.parse(testSubject({
      data: fixtureTransaction.serialized,
      type: 'transaction'
    }))

    expect(actual.type).toBe(fixtureTransaction.data.type)
    expect(+actual.amount).toBe(fixtureTransaction.data.amount)
    expect(+actual.fee).toBe(fixtureTransaction.data.fee)
    expect(actual.recipientId).toBe(fixtureTransaction.data.recipientId)
    expect(actual.timestamp).toBe(fixtureTransaction.data.timestamp)
    expect(actual.senderPublicKey).toBe(fixtureTransaction.data.senderPublicKey)
    expect(actual.signature).toBe(fixtureTransaction.data.signature)
    expect(actual.id).toBe(fixtureTransaction.data.id)
  })
})
