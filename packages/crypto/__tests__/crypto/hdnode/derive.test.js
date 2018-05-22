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
  describe('derive', () => {
    function verifyVector (hd, v) {
      if (hd.isNeutered()) {
        expect(hd.toBase58()).toBe(v.base58)
      } else {
        expect(hd.neutered().toBase58()).toBe(v.base58)
        expect(hd.toBase58()).toBe(v.base58Priv)
      }

      expect(hd.getFingerprint().toString('hex')).toBe(v.fingerprint)
      expect(hd.getIdentifier().toString('hex')).toBe(v.identifier)
      expect(hd.getAddress()).toBe(v.address)
      expect(hd.keyPair.toWIF()).toBe(v.wif)
      expect(hd.keyPair.getPublicKeyBuffer().toString('hex')).toBe(v.pubKey)
      expect(hd.chainCode.toString('hex')).toBe(v.chainCode)
      expect(hd.depth).toBe(v.depth >>> 0) // TODO: make sure it works later
      expect(hd.index).toBe(v.index >>> 0) // TODO: make sure it works later
    }

    fixtures.valid.forEach((f) => {
      const network = NETWORKS[f.network]
      let hd = HDNode.fromSeedHex(f.master.seed, network)
      const master = hd

      // testing deriving path = require(master
      f.children.forEach((c) => {
        it(`${c.path} = require(${f.master.fingerprint} by path`, () => {
          const child = master.derivePath(c.path)
          const childNoM = master.derivePath(c.path.slice(2)) // no m/ on path

          verifyVector(child, c)
          verifyVector(childNoM, c)
        })
      })

      // testing deriving path = require(children
      f.children.forEach((c, i) => {
        const cn = master.derivePath(c.path)

        f.children.slice(i + 1).forEach(function (cc) {
          it(`${cc.path} = require(${f.fingerprint} by path`, () => {
            const ipath = cc.path.slice(2).split('/').slice(i + 1).join('/')
            const child = cn.derivePath(ipath)
            verifyVector(child, cc)

            expect(() => {
              cn.derivePath('m/' + ipath)
            }).toThrowError(/Not a master node/)
          })
        })
      })

      // FIXME: test data is only testing Private -> private for now
      f.children.forEach((c, i) => {
        if (c.m === undefined) return

        it(`${c.path} = require(${f.master.fingerprint}`, () => {
          if (c.hardened) {
            hd = hd.deriveHardened(c.m)
          } else {
            hd = hd.derive(c.m)
          }

          verifyVector(hd, c)
        })
      })
    })

    it('works for Private -> public (neutered)', () => {
      const f = fixtures.valid[1]
      const c = f.children[0]

      const master = HDNode.fromBase58(f.master.base58Priv, NETWORKS_LIST)
      const child = master.derive(c.m).neutered()

      expect(child.toBase58()).toBe(c.base58)
    })

    it('works for Private -> public (neutered, hardened)', () => {
      const f = fixtures.valid[0]
      const c = f.children[0]

      const master = HDNode.fromBase58(f.master.base58Priv, NETWORKS_LIST)
      const child = master.deriveHardened(c.m).neutered()

      expect(c.base58).toBe(child.toBase58())
    })

    it('works for Public -> public', () => {
      const f = fixtures.valid[1]
      const c = f.children[0]

      const master = HDNode.fromBase58(f.master.base58, NETWORKS_LIST)
      const child = master.derive(c.m)

      expect(c.base58).toBe(child.toBase58())
    })

    it('throws on Public -> public (hardened)', () => {
      const f = fixtures.valid[0]
      const c = f.children[0]

      const master = HDNode.fromBase58(f.master.base58, NETWORKS_LIST)

      expect(() => {
        master.deriveHardened(c.m)
      }).toThrowError(/Could not derive hardened child key/)
    })

    it('throws on wrong types', () => {
      const f = fixtures.valid[0]
      const master = HDNode.fromBase58(f.master.base58, NETWORKS_LIST)

      fixtures.invalid.derive.forEach((fx) => {
        expect(() => {
          master.derive(fx)
        }).toThrowError(/Expected UInt32/)
      })

      fixtures.invalid.deriveHardened.forEach((fx) => {
        expect(() => {
          master.deriveHardened(fx)
        }).toThrowError(/Expected UInt31/)
      })

      fixtures.invalid.derivePath.forEach((fx) => {
        expect(() => {
          master.derivePath(fx)
        }).toThrowError(/Expected BIP32 derivation path/)
      })
    })

    it('works when private key has leading zeros', () => {
      const key = 'xprv9s21ZrQH143K3ckY9DgU79uMTJkQRLdbCCVDh81SnxTgPzLLGax6uHeBULTtaEtcAvKjXfT7ZWtHzKjTpujMkUd9dDb8msDeAfnJxrgAYhr'
      const hdkey = HDNode.fromBase58(key, NETWORKS.bitcoin)
      expect(hdkey.keyPair.d.toBuffer(32).toString('hex')).toBe('00000055378cf5fafb56c711c674143f9b0ee82ab0ba2924f19b64f5ae7cdbfd')

      const child = hdkey.derivePath('m/44\'/0\'/0\'/0/0\'')
      expect(child.keyPair.d.toBuffer().toString('hex')).toBe('3348069561d2a0fb925e74bf198762acc47dce7db27372257d2d959a9e6f8aeb')
    })
  })
})
