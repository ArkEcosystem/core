'use strict'

const { blocks } = require('../../../fixtures/blocks')

const msgpack = require('msgpack-lite')
const codec = require('../../../../lib/transport/codec').get('lite')

describe('Lite codec testing', () => {
  test('Single encode', () => {
    console.time('blocks')
    const encoded = msgpack.encode(blocks[1], { codec: codec.blocks })
    const decoded = msgpack.decode(encoded, { codec: codec.transactions })

    // removing helper property
    delete decoded.previous_block_hex

    expect(blocks[1]).toEqual(decoded)
    console.timeEnd('blocks')
  })
})
