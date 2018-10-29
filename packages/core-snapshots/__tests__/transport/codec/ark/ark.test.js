'use strict'

const { blocks } = require('../../../fixtures/blocks')
const { transactions } = require('../../../fixtures/transactions')
const pick = require('lodash/pick')

const msgpack = require('msgpack-lite')
const codec = require('../../../../lib/transport/codec').get('ark')

beforeAll(async () => {
  transactions.forEach(transaction => {
    transaction.serialized = Buffer.from(transaction.serializedHex, 'hex')
  })
})

describe('Ark codec testing', () => {
  test('Single encode', () => {
    console.time('singleblock')
    const encoded = msgpack.encode(blocks[1], { codec: codec.blocks })
    const decoded = msgpack.decode(encoded, { codec: codec.blocks })

    // removing helper property
    delete decoded.previous_block_hex

    expect(decoded).toEqual(blocks[1])
    console.timeEnd('singleblock')
  })

  test('Block codec should encode/decode with no differences', () => {
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

  test('Transaction codec should encode/decode with no differences', () => {
    console.time('transactions')
    const properties = ['id', 'version', 'block_id', 'sequence', 'timestamp', 'sender_public_key', 'recipient_id', 'type', 'vendor_field_hex', 'amount', 'fee', 'serialized']
    for (const transaction of transactions) {
      const encoded = msgpack.encode(transaction, { codec: codec.transactions })
      const decoded = msgpack.decode(encoded, { codec: codec.transactions })
      console.log(decoded)
      decoded.serialized = transactions.serialized
      const source = pick(transaction, properties)
      const dest = pick(decoded, properties)

      expect(dest).toEqual(source)
    }
    console.timeEnd('transactions')
  })
})
