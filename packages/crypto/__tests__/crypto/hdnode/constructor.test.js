const BigInteger = require('bigi')

const configManager = require('../../../lib/managers/config')
const ECPair = require('../../../lib/crypto/ecpair')
const HDNode = require('../../../lib/crypto/hdnode')
const { NETWORKS, NETWORKS_LIST } = require('../../utils/network-list')

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
  describe('Constructor', () => {
    let keyPair
    let chainCode

    beforeEach(() => {
      const d = BigInteger.ONE

      keyPair = new ECPair(d, null)
      chainCode = Buffer.alloc(32)
      chainCode.fill(1)
    })

    it('stores the keyPair/chainCode directly', () => {
      const hd = new HDNode(keyPair, chainCode)

      expect(hd.keyPair).toBe(keyPair)
      expect(hd.chainCode).toBe(chainCode)
    })

    it('has a default depth/index of 0', () => {
      const hd = new HDNode(keyPair, chainCode)

      expect(hd.depth).toBe(0)
      expect(hd.index).toBe(0)
    })

    it('throws on uncompressed keyPair', () => {
      keyPair.compressed = false

      expect(() => {
        new HDNode(keyPair, chainCode) // eslint-disable-line no-new
      }).toThrowError(/BIP32 only allows compressed keyPairs/)
    })

    it('throws when an invalid length chain code is given', () => {
      expect(() => {
        new HDNode(keyPair, Buffer.alloc(20)) // eslint-disable-line no-new
      }).toThrowError(/Expected property "1" of type Buffer\(Length: 32\), got Buffer\(Length: 20\)/)
    })
  })

  describe('getIdentifier', () => {
    validAll.forEach((f) => {
      it(`returns the identifier for ${f.fingerprint}`, () => {
        const hd = HDNode.fromBase58(f.base58, NETWORKS_LIST)

        expect(hd.getIdentifier().toString('hex')).toBe(f.identifier)
      })
    })
  })

  describe('getFingerprint', () => {
    validAll.forEach((f) => {
      it(`returns the fingerprint for ${f.fingerprint}`, () => {
        const hd = HDNode.fromBase58(f.base58, NETWORKS_LIST)

        expect(hd.getFingerprint().toString('hex')).toBe(f.fingerprint)
      })
    })
  })
})
