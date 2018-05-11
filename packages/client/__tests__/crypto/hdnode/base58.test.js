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
  describe('fromBase58 / toBase58', () => {
    validAll.forEach((f) => {
      it(`exports ${f.base58} (public) correctly`, () => {
        const hd = HDNode.fromBase58(f.base58, NETWORKS_LIST)

        expect(hd.toBase58()).toBe(f.base58)
        expect(() => {
          hd.keyPair.toWIF()
        }).toThrowError(/Missing private key/)
      })
    })

    validAll.forEach((f) => {
      it(`exports ${f.base58Priv} (private) correctly`, () => {
        const hd = HDNode.fromBase58(f.base58Priv, NETWORKS_LIST)

        expect(hd.toBase58()).toBe(f.base58Priv)
        expect(hd.keyPair.toWIF()).toBe(f.wif)
      })
    })

    fixtures.invalid.fromBase58.forEach((f) => {
      it(`throws on ${f.string}`, () => {
        expect(() => {
          const networks = f.network ? NETWORKS[f.network] : NETWORKS_LIST

          HDNode.fromBase58(f.string, networks)
        }).toThrowError(new RegExp(f.exception))
      })
    })
  })
})
