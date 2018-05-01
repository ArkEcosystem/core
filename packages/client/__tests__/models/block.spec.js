const ByteBuffer = require('bytebuffer')
const Block = require('../../lib/models/block')

describe('Models - Block', () => {
  const data = Object.freeze({
    id: '187940162505562345',
    blockSignature: '3045022100a6605198e0f590c88798405bc76748d84e280d179bcefed2c993e70cded2a5dd022008c7f915b89fc4f3250fc4b481abb753c68f30ac351871c50bd6cfaf151370e8', // eslint-disable-line max-len
    generatorPublicKey: '024c8247388a02ecd1de2a3e3fd5b7c61ecc2797fa3776599d558333ef1802d231',
    height: 10,
    numberOfTransactions: 0,
    payloadHash: '578e820911f24e039733b45e4882b73e301f813a0d2c31330dafda84534ffa23',
    payloadLength: 1,
    previousBlock: '12123',
    reward: 1,
    timestamp: 111150,
    totalAmount: 10,
    totalFee: 1,
    transactions: [],
    version: 6
  })

  describe('constructor', () => {
    xit('stores the data', () => {})
    xit('verifies the block', () => {})
  })

  describe('getHeader', () => {
    it('returns the block data without the transactions', () => {
      // Ignore the verification for testing purposes
      jest.spyOn(Block.prototype, 'verify').mockImplementation(() => ({ verified: true }))

      const data2 = { ...data }
      const header = (new Block(data2)).getHeader()

      Object.keys(data).forEach(key => {
        if (key !== 'transactions') {
          expect(header[key]).toEqual(data2[key])
        }
      })

      expect(header).not.toHaveProperty('transactions')
    })
  })

  describe('serialize', () => {
    const serialize = (data, includeSignature) => {
      const serialized = Block.serialize(data, includeSignature)
      const buffer = new ByteBuffer(1024, true)
      buffer.append(serialized)
      buffer.flip()
      return buffer
    }

    it('version is serialized as a TODO', () => {
      expect(serialize(data).readUInt32(0)).toEqual(data.version)
    })

    it('timestamp is serialized as a UInt32', () => {
      expect(serialize(data).readUInt32(4)).toEqual(data.timestamp)
    })

    it('height is serialized as a UInt32', () => {
      expect(serialize(data).readUInt32(8)).toEqual(data.height)
    })

    describe('if `previousBlockHex` exists', () => {
      it('is serialized as hexadecimal', () => {
        const data2 = { ...data, ...{ previousBlockHex: 'a00000000000000a' } }
        expect(serialize(data2).slice(12, 20).toString('hex')).toEqual(data2.previousBlockHex)
      })
    })

    describe('if `previousBlockHex` does not exist', () => {
      it('8 bytes are added, as padding', () => {
        expect(serialize(data).slice(12, 20).toString('hex')).toEqual('0000000000000000')
      })
    })

    it('number of transactions is serialized as a UInt32', () => {
      expect(serialize(data).readUInt32(20)).toEqual(data.numberOfTransactions)
    })

    it('`totalAmount` of transactions is serialized as a UInt64', () => {
      expect(serialize(data).readUInt64(24).toNumber()).toEqual(data.totalAmount)
    })

    it('`totalFee` of transactions is serialized as a UInt64', () => {
      expect(serialize(data).readUInt64(32).toNumber()).toEqual(data.totalFee)
    })

    it('`reward` of transactions is serialized as a UInt64', () => {
      expect(serialize(data).readUInt64(40).toNumber()).toEqual(data.reward)
    })

    it('`payloadLength` of transactions is serialized as a UInt32', () => {
      expect(serialize(data).readUInt32(48)).toEqual(data.payloadLength)
    })

    it('`payloadHash` of transactions is appended, using 32 bytes, as hexadecimal', () => {
      expect(serialize(data).slice(52, 52 + 32).toString('hex')).toEqual(data.payloadHash)
    })

    it('`generatorPublicKey` of transactions is appended, using 33 bytes, as hexadecimal', () => {
      expect(serialize(data).slice(84, 84 + 33).toString('hex')).toEqual(data.generatorPublicKey)
    })

    describe('if the `blockSignature` is not included', () => {
      it('is not serialized', () => {
        const data2 = { ...data }
        delete data2.blockSignature
        expect(serialize(data2).limit).toEqual(117)
      })

      it('is not serialized, even when the `includeSignature` parameter is true', () => {
        const data2 = { ...data }
        delete data2.blockSignature
        expect(serialize(data2, true).limit).toEqual(117)
      })
    })

    describe('if the `blockSignature` is included', () => {
      it('is serialized', () => {
        expect(serialize(data).slice(117, 188).toString('hex')).toEqual(data.blockSignature)
      })

      it('is serialized unless the `includeSignature` parameter is false', () => {
        expect(serialize(data, false).limit).toEqual(117)
      })
    })
  })
})
