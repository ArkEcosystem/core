import bip66 from 'bip66'
import typeforce from 'typeforce'
import types from '@/crypto/types'
import BigInteger from 'bigi'

/**
 * Creates a new ECSignature.
 *
 * @constructor
 * @param {BigInteger} r
 * @param {BigInteger} s
 */
export default class ECSignature {
  /**
   * [constructor description]
   * @param  {[type]} r [description]
   * @param  {[type]} s [description]
   * @return {[type]}   [description]
   */
  constructor (r, s) {
    typeforce(types.tuple(types.BigInt, types.BigInt), arguments)

    /** @type {BigInteger} */
    this.r = r
    /** @type {BigInteger} */
    this.s = s
  }

  /**
   * [parseNativeSecp256k1 description]
   * @param  {[type]} native [description]
   * @return {[type]}        [description]
   */
  static parseNativeSecp256k1 (native) {
    if (native.signature.length !== 64) throw new Error('Invalid signature length')

    const compressed = 0
    const recoveryParam = native.recovery

    const r = BigInteger.fromBuffer(native.signature.slice(0, 32))
    const s = BigInteger.fromBuffer(native.signature.slice(32))

    return {
      compressed,
      i: recoveryParam,
      signature: new ECSignature(r, s)
    }
  }

  /**
   * [toNativeSecp256k1 description]
   * @return {[type]} [description]
   */
  toNativeSecp256k1 () {
    const buffer = Buffer.alloc(64)
    if (this.r.toBuffer().length > 32 || this.s.toBuffer().length > 32) {
      return buffer
    }

    this.r.toBuffer(32).copy(buffer, 0)
    this.s.toBuffer(32).copy(buffer, 32)

    return buffer
  }

  /**
   * [parseCompact description]
   * @param  {[type]} buffer [description]
   * @return {[type]}        [description]
   */
  static parseCompact (buffer) {
    if (buffer.length !== 65) throw new Error('Invalid signature length')

    const flagByte = buffer.readUInt8(0) - 27
    if (flagByte !== (flagByte & 7)) throw new Error('Invalid signature parameter')

    const compressed = !!(flagByte & 4)
    const recoveryParam = flagByte & 3

    const r = BigInteger.fromBuffer(buffer.slice(1, 33))
    const s = BigInteger.fromBuffer(buffer.slice(33))

    return {
      compressed,
      i: recoveryParam,
      signature: new ECSignature(r, s)
    }
  }

  /**
   * [fromDER description]
   * @param  {[type]} buffer [description]
   * @return {[type]}        [description]
   */
  static fromDER (buffer) {
    const decode = bip66.decode(buffer)
    const r = BigInteger.fromDERInteger(decode.r)
    const s = BigInteger.fromDERInteger(decode.s)

    return new ECSignature(r, s)
  }

  /**
   * BIP62: 1-byte `hashType` flag (only `0x01`, `0x02`, `0x03`, `0x81`, `0x82`, and `0x83` are allowed).
   *
   * @param  {[type]} buffer [description]
   * @return {[type]}        [description]
   */
  static parseScriptSignature (buffer) {
    const hashType = buffer.readUInt8(buffer.length - 1)
    const hashTypeMod = hashType & ~0x80

    if (hashTypeMod <= 0x00 || hashTypeMod >= 0x04) throw new Error('Invalid hashType ' + hashType)

    return {
      signature: this.fromDER(buffer.slice(0, -1)),
      hashType
    }
  }

  /**
   * [toCompact description]
   * @param  {[type]} i          [description]
   * @param  {[type]} compressed [description]
   * @return {[type]}            [description]
   */
  toCompact (i, compressed) {
    if (compressed) {
      i += 4
    }

    i += 27

    const buffer = Buffer.alloc(65)
    buffer.writeUInt8(i, 0)

    this.r.toBuffer(32).copy(buffer, 1)
    this.s.toBuffer(32).copy(buffer, 33)

    return buffer
  }

  /**
   * [toDER description]
   * @return {[type]} [description]
   */
  toDER () {
    const r = Buffer.from(this.r.toDERInteger())
    const s = Buffer.from(this.s.toDERInteger())

    return bip66.encode(r, s)
  }

  /**
   * [toScriptSignature description]
   * @param  {[type]} hashType [description]
   * @return {[type]}          [description]
   */
  toScriptSignature (hashType) {
    const hashTypeMod = hashType & ~0x80
    if (hashTypeMod <= 0 || hashTypeMod >= 4) throw new Error('Invalid hashType ' + hashType)

    const hashTypeBuffer = Buffer.alloc(1)
    hashTypeBuffer.writeUInt8(hashType, 0)

    return Buffer.concat([this.toDER(), hashTypeBuffer])
  }
}
