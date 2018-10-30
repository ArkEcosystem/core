'use strict'

const { blocks } = require('../../../fixtures/blocks')
const { transactions } = require('../../../fixtures/transactions')

const msgpack = require('msgpack-lite')
const codec = require('../../../../lib/transport/codec').get('lite')

beforeAll(async () => {
  transactions.forEach(transaction => {
    transaction.serialized = Buffer.from(transaction.serializedHex, 'hex')
  })
})

describe('Lite codec testing', () => {
  test('Encode/Decode single block', () => {
    console.time('singleblock')
    const encoded = msgpack.encode(blocks[1], { codec: codec.blocks })
    const decoded = msgpack.decode(encoded, { codec: codec.blocks })

    // removing helper property
    delete decoded.previous_block_hex

    expect(decoded).toEqual(blocks[1])
    console.timeEnd('singleblock')
  })

  test('Encode/Decode blocks', () => {
    console.time('blocks')
    for (const [index, block] of blocks.entries()) {
      // TODO: skipping genesis for now - wrong id calculation
      if (index === 0) {
        continue
      }

      const encoded = msgpack.encode(block, { codec: codec.blocks })
      const decoded = msgpack.decode(encoded, { codec: codec.blocks })

      // removing helper property
      delete decoded.previous_block_hex

      expect(block).toEqual(decoded)
    }
    console.timeEnd('blocks')
  })

  test('Encode/Decode transactions - all types', () => {
    console.time('transactions')
    for (const transaction of transactions) {
      delete transaction.serializedHex

      const encoded = msgpack.encode(transaction, { codec: codec.transactions })
      const decoded = msgpack.decode(encoded, { codec: codec.transactions })

      expect(decoded).toEqual(transaction)
    }
    console.timeEnd('transactions')
  })

  test('Encode/Decode transfer transactions', () => {
    console.time('transactions lite transfer')
    const transferTransactions = transactions.filter(trx => trx.type === 0)
    for (let i = 0; i < 100; i++) {
      for (const transaction of transferTransactions) {
        const encoded = msgpack.encode(transaction, { codec: codec.transactions })
        const decoded = msgpack.decode(encoded, { codec: codec.transactions })

        expect(decoded).toEqual(transaction)
      }
    }
    console.timeEnd('transactions lite transfer')
  })
})
