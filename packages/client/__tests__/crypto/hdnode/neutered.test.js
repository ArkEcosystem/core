const assert = require('assert')

const configManager = require('../../../lib/managers/config')
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
  describe('neutered / isNeutered', () => {
    validAll.forEach((f) => {
      it(`drops the private key for ${f.fingerprint}`, () => {
        const hd = HDNode.fromBase58(f.base58Priv, NETWORKS_LIST)
        const hdn = hd.neutered()

        assert.notEqual(hdn.keyPair, hd.keyPair)
        expect(() => {
          hdn.keyPair.toWIF()
        }).toThrowError(/Missing private key/)
        expect(hdn.toBase58()).toBe(f.base58)
        expect(hdn.chainCode).toBe(hd.chainCode)
        expect(hdn.depth).toBe(f.depth >>> 0) // TODO: make sure it works later
        expect(hdn.index).toBe(f.index >>> 0) // TODO: make sure it works later
        expect(hdn.isNeutered()).toBeTruthy()

        // does not modify the original
        expect(hd.toBase58()).toBe(f.base58Priv)
        expect(hd.isNeutered()).toBeFalsy()
      })
    })
  })
})
