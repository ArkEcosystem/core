'use strict'

const { blocks } = require('../../../fixtures/blocks')

const msgpack = require('msgpack-lite')
const { blockCodec } = require('../../../../lib/transport/codec')

describe('Codecs - Block', () => {
  test('codec enode/decode block test', () => {
    console.time('start10')
    for (const [index, block] of blocks.entries()) {
      // TODO: skipping genesis for now
      if (index === 0) {
        continue
      }

      const encoded = msgpack.encode(block, { codec: blockCodec() })
      const decoded = msgpack.decode(encoded, { codec: blockCodec() })
      // removing helper property
      delete decoded.data.previous_block_hex

      expect(decoded.data).toEqual(block)
    }
    console.timeEnd('start10')
  })
})
