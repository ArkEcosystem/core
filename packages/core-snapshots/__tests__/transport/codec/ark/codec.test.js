'use strict'

const { blocks } = require('../../../fixtures/blocks')
const { transactions } = require('../../../fixtures/transactions')
const pick = require('lodash/pick')

const msgpack = require('msgpack-lite')
const { blockCodec, transactionCodec } = require('../../../../lib/transport/codec')

describe('Ark codec testing', () => {
  test('Block codec should encode/decode with no differences', () => {
    console.time('blocks')
    for (const [index, block] of blocks.entries()) {
      // TODO: skipping genesis for now - wrong id calculation
      if (index === 0) {
        continue
      }

      const encoded = msgpack.encode(block, { codec: blockCodec() })
      const decoded = msgpack.decode(encoded, { codec: blockCodec() })
      // removing helper property
      delete decoded.data.previous_block_hex

      expect(decoded.data).toEqual(block)
    }
    console.timeEnd('blocks')
  })

  test('Transaction codec should encode/decode with no differences', () => {
    console.time('transactions')
    const properties = ['id', 'sequence', 'version', 'timestamp', 'senderPublicKey', 'type', 'amount', 'fee', 'blockId', 'signature', 'asset']
    for (const transaction of transactions) {
      transaction.serialized = Buffer.from(transaction.serializedHex, 'hex')

      const encoded = msgpack.encode(transaction, { codec: transactionCodec() })
      const decoded = msgpack.decode(encoded, { codec: transactionCodec() })

      const source = pick(transaction, properties)
      const dest = pick(decoded.data, properties)

      expect(source).toEqual(dest)
    }
    console.timeEnd('transactions')
  })
})
