'use strict'

const { blockSnake } = require('../../fixtures/blocks')

const msgpack = require('msgpack-lite')
const { blockCodec } = require('../../../lib/transport/codec')


describe('Codecs - Block', () => {
  test('codec enode/decode block test', () => {
    console.time('encode')
    const encoded = msgpack.encode(blockSnake, { codec: blockCodec })
    console.timeEnd('encode')

    console.time('decode')
    const decoded = msgpack.decode(encoded, { codec: blockCodec })
    console.timeEnd('decode')

    expect(decoded).toEqual(blockSnake)
  })
})
