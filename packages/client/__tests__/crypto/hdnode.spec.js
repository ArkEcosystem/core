import assert from 'assert'
import sinon from 'sinon'
import sinonTestFactory from 'sinon-test'
import BigInteger from 'bigi'

import configManager from '../../lib/managers/config'
import ecdsa from '../../lib/crypto/ecdsa'
import ECPair from '../../lib/crypto/ecpair'
import HDNode from '../../lib/crypto/hdnode'
import { NETWORKS, NETWORKS_LIST } from '../utils/network-list'

import fixtures from './fixtures/hdnode.json'

const sinonTest = sinonTestFactory(sinon)

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

  describe('fromSeed*', () => {
    fixtures.valid.forEach((f) => {
      it(`calculates privKey and chainCode for ${f.master.fingerprint}`, () => {
        const hd = HDNode.fromSeedHex(f.master.seed, NETWORKS[f.network])

        expect(hd.keyPair.toWIF()).toBe(f.master.wif)
        expect(hd.chainCode.toString('hex')).toBe(f.master.chainCode)
      })
    })

    it('throws if IL is not within interval [1, n - 1] | IL === 0', sinonTest(function () {
      this.mock(BigInteger).expects('fromBuffer')
        .once().returns(BigInteger.ZERO)

      expect(() => {
        HDNode.fromSeedHex('ffffffffffffffffffffffffffffffff')
      }).toThrowError(/Private key must be greater than 0/)
    }))

    it('throws if IL is not within interval [1, n - 1] | IL === n', sinonTest(function () {
      this
        .mock(BigInteger)
        .expects('fromBuffer')
        .once()
        .returns(ecdsa.__curve.n)

      expect(() => {
        HDNode.fromSeedHex('ffffffffffffffffffffffffffffffff')
      }).toThrowError(/Private key must be less than the curve order/)
    }))

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

  describe('ECPair wrappers', () => {
    let keyPair
    let hd
    let hash

    beforeEach(() => {
      keyPair = ECPair.makeRandom()
      hash = Buffer.alloc(32)

      const chainCode = Buffer.alloc(32)
      hd = new HDNode(keyPair, chainCode)
    })

    describe('getAddress', () => {
      it('wraps keyPair.getAddress', sinonTest(function () {
        this
          .mock(keyPair)
          .expects('getAddress')
          .once()
          .withArgs()
          .returns('foobar')

        expect(hd.getAddress()).toBe('foobar')
      }))
    })

    describe('getNetwork', () => {
      it('wraps keyPair.getNetwork', sinonTest(function () {
        this
          .mock(keyPair)
          .expects('getNetwork')
          .once()
          .withArgs()
          .returns('network')

        expect(hd.getNetwork()).toBe('network')
      }))
    })

    describe('getPublicKeyBuffer', () => {
      it('wraps keyPair.getPublicKeyBuffer', sinonTest(function () {
        this
          .mock(keyPair)
          .expects('getPublicKeyBuffer')
          .once()
          .withArgs()
          .returns('pubKeyBuffer')

        expect(hd.getPublicKeyBuffer()).toBe('pubKeyBuffer')
      }))
    })

    describe('sign', () => {
      it('wraps keyPair.sign', sinonTest(function () {
        this.mock(keyPair).expects('sign')
          .once().withArgs(hash).returns('signed')

        expect(hd.sign(hash)).toBe('signed')
      }))
    })

    describe('verify', () => {
      let signature

      beforeEach(() => {
        signature = hd.sign(hash)
      })

      it('wraps keyPair.verify', sinonTest(function () {
        this.mock(keyPair).expects('verify')
          .once().withArgs(hash, signature).returns('verified')

        expect(hd.verify(hash, signature)).toBe('verified')
      }))
    })
  })

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

      // testing deriving path from master
      f.children.forEach((c) => {
        it(`${c.path} from ${f.master.fingerprint} by path`, () => {
          const child = master.derivePath(c.path)
          const childNoM = master.derivePath(c.path.slice(2)) // no m/ on path

          verifyVector(child, c)
          verifyVector(childNoM, c)
        })
      })

      // testing deriving path from children
      f.children.forEach((c, i) => {
        const cn = master.derivePath(c.path)

        f.children.slice(i + 1).forEach(function (cc) {
          it(`${cc.path} from ${f.fingerprint} by path`, () => {
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

        it(`${c.path} from ${f.master.fingerprint}`, () => {
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
