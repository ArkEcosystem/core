const BigInteger = require('bigi')

const configManager = require('../../../lib/managers/config')
const ecdsa = require('../../../lib/crypto/ecdsa')
const HDNode = require('../../../lib/crypto/hdnode')
const { NETWORKS } = require('../../utils/network-list')

const fixtures = require('../fixtures/hdnode.json')

beforeEach(() => configManager.setConfig(NETWORKS.mainnet))

let validAll = []
fixtures.valid.forEach((f) => {
  function addNetwork (n) {
    n.network = f.network
    return n
  }

  validAll = validAll.concat(addNetwork(f.master), f.children.map(addNetwork))
})

describe('HDNode', () => {
  describe('fromSeed*', () => {
    fixtures.valid.forEach((f) => {
      it(`calculates privKey and chainCode for ${f.master.fingerprint}`, () => {
        const hd = HDNode.fromSeedHex(f.master.seed, NETWORKS[f.network])

        expect(hd.keyPair.toWIF()).toBe(f.master.wif)
        expect(hd.chainCode.toString('hex')).toBe(f.master.chainCode)
      })
    })

    it('throws if IL is not within interval [1, n - 1] | IL === 0', () => {
      BigInteger.fromBuffer = jest.fn()
      BigInteger.fromBuffer.mockReturnValue(BigInteger.ZERO)

      expect(() => {
        HDNode.fromSeedHex('ffffffffffffffffffffffffffffffff')
      }).toThrowError(/Private key must be greater than 0/)

      expect(BigInteger.fromBuffer).toHaveBeenCalledTimes(1)
    })

    it('throws if IL is not within interval [1, n - 1] | IL === n', () => {
      BigInteger.fromBuffer = jest.fn()
      BigInteger.fromBuffer.mockReturnValue(ecdsa.__curve.n)

      expect(() => {
        HDNode.fromSeedHex('ffffffffffffffffffffffffffffffff')
      }).toThrowError(/Private key must be less than the curve order/)

      expect(BigInteger.fromBuffer).toHaveBeenCalledTimes(1)
    })

    it('throws on low entropy seed', () => {
      expect(() => {
        HDNode.fromSeedHex('ffffffffff')
      }).toThrowError(/Seed should be at least 128 bits/)
    })

    it('throws on too high entropy seed', () => {
      expect(() => {
        HDNode.fromSeedHex('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') // eslint-disable-line max-len
      }).toThrowError(/Seed should be at most 512 bits/)
    })
  })
})
