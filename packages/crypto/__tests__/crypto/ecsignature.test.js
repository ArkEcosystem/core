const BigInteger = require('bigi')

const ECSignature = require('../../lib/crypto/ecsignature')
const configManager = require('../../lib/managers/config')
const network = require('../../lib/networks/phantom/mainnet.json')

const fixtures = require('./fixtures/ecsignature.json')

beforeEach(() => configManager.setConfig(network))

describe('ECSignature', () => {
  describe('toCompact', () => {
    fixtures.valid.forEach((f) => {
      it('exports ' + f.compact.hex + ' correctly', () => {
        const signature = new ECSignature(new BigInteger(f.signature.r), new BigInteger(f.signature.s))

        const buffer = signature.toCompact(f.compact.i, f.compact.compressed)
        expect(buffer.toString('hex')).toBe(f.compact.hex)
      })
    })
  })

  describe('parseCompact', () => {
    fixtures.valid.forEach((f) => {
      it(`imports ${f.compact.hex} correctly`, () => {
        const buffer = Buffer.from(f.compact.hex, 'hex')
        const parsed = ECSignature.parseCompact(buffer)

        expect(parsed.compressed).toBe(f.compact.compressed)
        expect(parsed.i).toBe(f.compact.i)
        expect(parsed.signature.r.toString()).toBe(f.signature.r)
        expect(parsed.signature.s.toString()).toBe(f.signature.s)
      })
    })

    fixtures.invalid.compact.forEach((f) => {
      it(`throws on ${f.hex}`, () => {
        const buffer = Buffer.from(f.hex, 'hex')

        expect(() => {
          ECSignature.parseCompact(buffer)
        }).toThrowError(new RegExp(f.exception))
      })
    })
  })

  describe('toDER', () => {
    fixtures.valid.forEach((f) => {
      it(`exports ${f.DER} correctly`, () => {
        const signature = new ECSignature(new BigInteger(f.signature.r), new BigInteger(f.signature.s))

        const DER = signature.toDER()
        expect(DER.toString('hex')).toBe(f.DER)
      })
    })
  })

  describe('fromDER', () => {
    fixtures.valid.forEach((f) => {
      it(`imports ${f.DER} correctly`, () => {
        const buffer = Buffer.from(f.DER, 'hex')
        const signature = ECSignature.fromDER(buffer)

        expect(signature.r.toString()).toBe(f.signature.r)
        expect(signature.s.toString()).toBe(f.signature.s)
      })
    })

    fixtures.invalid.DER.forEach((f) => {
      it(`throws ${f.exception} for ${f.hex}`, () => {
        const buffer = Buffer.from(f.hex, 'hex')

        expect(() => {
          ECSignature.fromDER(buffer)
        }).toThrowError(new RegExp(f.exception))
      })
    })
  })

  describe('toScriptSignature', () => {
    fixtures.valid.forEach((f) => {
      it(`exports ${f.scriptSignature.hex} correctly`, () => {
        const signature = new ECSignature(new BigInteger(f.signature.r), new BigInteger(f.signature.s))

        const scriptSignature = signature.toScriptSignature(f.scriptSignature.hashType)
        expect(scriptSignature.toString('hex')).toBe(f.scriptSignature.hex)
      })
    })

    fixtures.invalid.scriptSignature.forEach((f) => {
      it(`throws ${f.exception}`, () => {
        const signature = new ECSignature(new BigInteger(f.signature.r), new BigInteger(f.signature.s))

        expect(() => {
          signature.toScriptSignature(f.hashType)
        }).toThrowError(new RegExp(f.exception))
      })
    })
  })

  describe('parseScriptSignature', () => {
    fixtures.valid.forEach((f) => {
      it(`imports ${f.scriptSignature.hex} correctly`, () => {
        const buffer = Buffer.from(f.scriptSignature.hex, 'hex')
        const parsed = ECSignature.parseScriptSignature(buffer)

        expect(parsed.signature.r.toString()).toBe(f.signature.r)
        expect(parsed.signature.s.toString()).toBe(f.signature.s)
        expect(parsed.hashType).toBe(f.scriptSignature.hashType)
      })
    })

    fixtures.invalid.scriptSignature.forEach((f) => {
      it(`throws on ${f.hex}`, () => {
        const buffer = Buffer.from(f.hex, 'hex')

        expect(() => {
          ECSignature.parseScriptSignature(buffer)
        }).toThrowError(new RegExp(f.exception))
      })
    })
  })
})
