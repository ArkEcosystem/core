import sinon from 'sinon'
import sinonTestFactory from 'sinon-test'
import BigInteger from 'bigi'

import ecdsa from '../../src/crypto/ecdsa'
import bcrypto from '../../src/crypto'
import ECSignature from '../../src/crypto/ecsignature'

import fixtures from './fixtures/ecdsa.json'

const curve = ecdsa.__curve
const sinonTest = sinonTestFactory(sinon)

describe('ecdsa', () => {
  describe('deterministicGenerateK', () => {
    function checkSig () {
      return true
    }

    fixtures.valid.ecdsa.forEach((f) => {
      it(`for "${f.message}"`, () => {
        const x = BigInteger.fromHex(f.d).toBuffer(32)
        const h1 = bcrypto.sha256(f.message)

        const k = ecdsa.deterministicGenerateK(h1, x, checkSig)
        expect(k.toHex()).toBe(f.k)
      })
    })

    it('loops until an appropriate k value is found', sinonTest(function () {
      this
        .mock(BigInteger)
        .expects('fromBuffer')
        .exactly(3)
        .onCall(0).returns(new BigInteger('0')) // < 1
        .onCall(1).returns(curve.n) // > n-1
        .onCall(2).returns(new BigInteger('42')) // valid

      const x = new BigInteger('1').toBuffer(32)
      const h1 = Buffer.alloc(32)
      const k = ecdsa.deterministicGenerateK(h1, x, checkSig)

      expect(k.toString()).toBe('42')
    }))

    it('loops until a suitable signature is found', sinonTest(function () {
      this
        .mock(BigInteger)
        .expects('fromBuffer')
        .exactly(4)
        .onCall(0).returns(new BigInteger('0')) // < 1
        .onCall(1).returns(curve.n) // > n-1
        .onCall(2).returns(new BigInteger('42')) // valid, but 'bad' signature
        .onCall(3).returns(new BigInteger('53')) // valid, good signature

      const checkSig = this.mock()
      checkSig.exactly(2)
      checkSig.onCall(0).returns(false) // bad signature
      checkSig.onCall(1).returns(true) // good signature

      const x = new BigInteger('1').toBuffer(32)
      const h1 = Buffer.alloc(32)
      const k = ecdsa.deterministicGenerateK(h1, x, checkSig)

      expect(k.toString()).toBe('53')
    }))

    fixtures.valid.rfc6979.forEach((f) => {
      it(`produces the expected k values for "${f.message}" if k wasn't suitable`, () => {
        const x = BigInteger.fromHex(f.d).toBuffer(32)
        const h1 = bcrypto.sha256(f.message)

        const results = []
        ecdsa.deterministicGenerateK(h1, x, function (k) {
          results.push(k)

          return results.length === 16
        })

        expect(results[0].toHex()).toBe(f.k0)
        expect(results[1].toHex()).toBe(f.k1)
        expect(results[15].toHex()).toBe(f.k15)
      })
    })
  })

  describe('sign', () => {
    fixtures.valid.ecdsa.forEach((f) => {
      it(`produces a deterministic signature for "${f.message}"`, () => {
        const d = BigInteger.fromHex(f.d)
        const hash = bcrypto.sha256(f.message)
        const signature = ecdsa.sign(hash, d).toDER()

        expect(signature.toString('hex')).toBe(f.signature)
      })
    })

    it('should sign with low S value', () => {
      const hash = bcrypto.sha256('Vires in numeris')
      const sig = ecdsa.sign(hash, BigInteger.ONE)

      // See BIP62 for more information
      const N_OVER_TWO = curve.n.shiftRight(1)
      expect(sig.s.compareTo(N_OVER_TWO)).toBeLessThanOrEqual(0)
    })
  })

  describe('verify', () => {
    fixtures.valid.ecdsa.forEach((f) => {
      it(`verifies a valid signature for "${f.message}"`, () => {
        const d = BigInteger.fromHex(f.d)
        const H = bcrypto.sha256(f.message)
        const signature = ECSignature.fromDER(Buffer.from(f.signature, 'hex'))
        const Q = curve.G.multiply(d)

        expect(ecdsa.verify(H, signature, Q)).toBeTruthy()
      })
    })

    fixtures.invalid.verify.forEach((f) => {
      it(`fails to verify with ${f.description}`, () => {
        const H = bcrypto.sha256(f.message)
        const d = BigInteger.fromHex(f.d)

        let signature
        if (f.signature) {
          signature = ECSignature.fromDER(Buffer.from(f.signature, 'hex'))
        } else if (f.signatureRaw) {
          signature = new ECSignature(new BigInteger(f.signatureRaw.r, 16), new BigInteger(f.signatureRaw.s, 16))
        }

        const Q = curve.G.multiply(d)

        expect(ecdsa.verify(H, signature, Q)).toBeFalsy()
      })
    })
  })
})
