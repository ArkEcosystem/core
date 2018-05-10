const ecurve = require('ecurve')
const BigInteger = require('bigi')

const ECPair = require('../../lib/crypto/ecpair')
const ecdsa = require('../../lib/crypto/ecdsa')
const configManager = require('../../lib/managers/config')

const fixtures = require('./fixtures/ecpair.json')
const { NETWORKS, NETWORKS_LIST } = require('../utils/network-list')

const curve = ecdsa.__curve

beforeEach(() => configManager.setConfig(NETWORKS.mainnet))

describe('ECPair', () => {
  describe('constructor', () => {
    it('defaults to compressed', () => {
      const keyPair = new ECPair(BigInteger.ONE)

      expect(keyPair.compressed).toBeTruthy()
    })

    it('supports the uncompressed option', () => {
      const keyPair = new ECPair(BigInteger.ONE, null, {
        compressed: false
      })

      expect(keyPair.compressed).toBeFalsy()
    })

    it('supports the network option', () => {
      const keyPair = new ECPair(BigInteger.ONE, null, {
        compressed: false,
        network: NETWORKS.devnet
      })

      expect(keyPair.network).toEqual(NETWORKS.devnet)
    })

    fixtures.valid.forEach((f) => {
      it(`calculates the public point for ${f.WIF}`, () => {
        const d = new BigInteger(f.d)
        const keyPair = new ECPair(d, null, {
          compressed: f.compressed,
          network: NETWORKS[f.network]
        })

        expect(keyPair.getPublicKeyBuffer().toString('hex')).toBe(f.Q)
      })
    })

    fixtures.invalid.constructor.forEach((f) => {
      it(`throws ${f.exception}`, () => {
        const d = f.d && new BigInteger(f.d) // eslint-disable-line no-new
        const Q = f.Q && ecurve.Point.decodeFrom(curve, Buffer.from(f.Q, 'hex'))

        expect(() => {
          new ECPair(d, Q, f.options) // eslint-disable-line no-new
        }).toThrowError(new RegExp(f.exception))
      })
    })
  })

  describe('getPublicKeyBuffer', () => {
    let keyPair

    beforeEach(() => {
      keyPair = new ECPair(BigInteger.ONE)
    })

    it('wraps Q.getEncoded', () => {
      keyPair.Q.getEncoded = jest.fn()

      keyPair.getPublicKeyBuffer()

      expect(keyPair.Q.getEncoded).toHaveBeenCalledWith(keyPair.compressed)
    })
  })

  describe('fromWIF', () => {
    fixtures.valid.forEach((f) => {
      it(`imports ${f.WIF} (${f.network})`, () => {
        const network = NETWORKS[f.network]
        const keyPair = ECPair.fromWIF(f.WIF, network)

        expect(keyPair.d.toString()).toBe(f.d)
        expect(keyPair.getPublicKeyBuffer().toString('hex')).toBe(f.Q)
        expect(keyPair.compressed).toBe(f.compressed)
        expect(keyPair.network).toEqual(network)
      })
    })

    fixtures.valid.forEach((f) => {
      it(`imports ${f.WIF} (via list of networks)`, () => {
        const network = NETWORKS[f.network]
        const keyPair = ECPair.fromWIF(f.WIF, network)

        expect(keyPair.d.toString()).toBe(f.d)
        expect(keyPair.getPublicKeyBuffer().toString('hex')).toBe(f.Q)
        expect(keyPair.compressed).toBe(f.compressed)
        expect(keyPair.network).toEqual(network)
      })
    })

    fixtures.invalid.fromWIF.forEach((f) => {
      it(`throws on ${f.WIF}`, () => {
        expect(() => {
          const networks = f.network ? NETWORKS[f.network] : NETWORKS_LIST

          ECPair.fromWIF(f.WIF, networks)
        }).toThrowError(new RegExp(f.exception))
      })
    })
  })

  describe('toWIF', () => {
    fixtures.valid.forEach((f) => {
      it(`exports ${f.WIF}`, () => {
        const keyPair = ECPair.fromWIF(f.WIF, NETWORKS_LIST)

        expect(keyPair.toWIF()).toBe(f.WIF)
      })
    })
  })

  describe('makeRandom', () => {
    let d = Buffer.from('0404040404040404040404040404040404040404040404040404040404040404', 'hex')
    let exWIF = 'S9hzwiZ5ziKjUiFpuZX4Lri3rUocDxZSTy7YzKKHvx8TSjUrYQ27'

    it('uses randombytes RNG to generate a ECPair', () => {
      const stub = {
        rng: () => {
          return d
        }
      }

      const keyPair = ECPair.makeRandom(stub)
      expect(keyPair.toWIF()).toBe(exWIF)
    })

    it('allows a custom RNG to be used', () => {
      const keyPair = ECPair.makeRandom({
        rng: (size) => {
          return d.slice(0, size)
        }
      })

      expect(keyPair.toWIF()).toBe(exWIF)
    })

    it('retains the same defaults as ECPair constructor', () => {
      const keyPair = ECPair.makeRandom()

      expect(keyPair.compressed).toBeTruthy()
      expect(keyPair.network).toEqual(NETWORKS.mainnet)
    })

    it('supports the options parameter', () => {
      const keyPair = ECPair.makeRandom({
        compressed: false,
        network: NETWORKS.devnet
      })

      expect(keyPair.compressed).toBeFalsy()
      expect(keyPair.network).toEqual(NETWORKS.devnet)
    })

    it('loops until d is within interval [1, n - 1] : 1', () => {
      const rng = jest.fn()
      rng.mockReturnValueOnce(BigInteger.ZERO.toBuffer(32)) // invalid length
      rng.mockReturnValue(BigInteger.ONE.toBuffer(32)) // === 1

      ECPair.makeRandom({rng})

      expect(rng).toHaveBeenCalledTimes(2)
    })

    it('loops until d is within interval [1, n - 1] : n - 1', () => {
      const rng = jest.fn()
      rng.mockReturnValueOnce(BigInteger.ZERO.toBuffer(32)) // < 1
      rng.mockReturnValueOnce(curve.n.toBuffer(32)) // > n-1
      rng.mockReturnValue(curve.n.subtract(BigInteger.ONE).toBuffer(32)) // === n-1

      ECPair.makeRandom({rng})

      expect(rng).toHaveBeenCalledTimes(3)
    })
  })

  describe('getAddress', () => {
    fixtures.valid.forEach((f) => {
      it(`returns ${f.address} for ${f.WIF}`, () => {
        const keyPair = ECPair.fromWIF(f.WIF, NETWORKS[f.network])

        expect(keyPair.getAddress()).toBe(f.address)
      })
    })
  })

  describe('getNetwork', () => {
    fixtures.valid.forEach((f) => {
      it(`returns ${f.network} for ${f.WIF}`, () => {
        const keyPair = ECPair.fromWIF(f.WIF, NETWORKS[f.network])

        expect(keyPair.network).toEqual(NETWORKS[f.network])
      })
    })
  })

  describe('ecdsa wrappers', () => {
    let keyPair
    let hash

    beforeEach(() => {
      keyPair = ECPair.makeRandom()
      hash = Buffer.alloc(32)
    })

    describe('signing', () => {
      it('throws if no private key is found', () => {
        keyPair.d = null

        expect(() => {
          keyPair.sign(hash)
        }).toThrowError(/Missing private key/)
      })
    })
  })
})
