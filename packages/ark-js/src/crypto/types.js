// TODO: REFACTOR THIS MADNESS

import typeforce from 'typeforce'

/**
 * [UINT31_MAX description]
 * @type {[type]}
 */
const UINT31_MAX = Math.pow(2, 31) - 1

/**
 * [UInt31 description]
 * @param {[type]} value [description]
 */
function UInt31 (value) {
  return typeforce.UInt32(value) && value <= UINT31_MAX
}

/**
 * [BIP32Path description]
 * @param {[type]} value [description]
 */
function BIP32Path (value) {
  return typeforce.String(value) && value.match(/^(m\/)?(\d+'?\/)*\d+'?$/)
}

/**
 * [description]
 * @return {[type]} [description]
 */
BIP32Path.toJSON = () => {
  return 'BIP32 derivation path'
}

/**
 * [SATOSHI_MAX description]
 * @type {[type]}
 */
const SATOSHI_MAX = 21 * 1e14

function Satoshi (value) {
  return typeforce.UInt53(value) && value <= SATOSHI_MAX
}

/**
 * external dependent types
 *
 * [BigInt description]
 * @type {[type]}
 */
const BigInt = typeforce.quacksLike('BigInteger')

/**
 * [ECPoint description]
 * @type {[type]}
 */
const ECPoint = typeforce.quacksLike('Point')

/**
 * exposed, external API
 *
 * [ECSignature description]
 * @type {[type]}
 */
const ECSignature = typeforce.compile({
  r: BigInt,
  s: BigInt
})

/**
 * [Network description]
 * @type {[type]}
 */
const Network = typeforce.compile({
  messagePrefix: typeforce.oneOf(typeforce.Buffer, typeforce.String),
  bip32: {
    public: typeforce.UInt32,
    private: typeforce.UInt32
  },
  pubKeyHash: typeforce.UInt8,
  wif: typeforce.UInt8
})

/**
 * extend typeforce types with ours
 *
 * [types description]
 * @type {Object}
 */
let types = {
  BigInt: BigInt,
  BIP32Path: BIP32Path,
  Buffer256bit: typeforce.BufferN(32),
  ECPoint: ECPoint,
  ECSignature: ECSignature,
  Hash160bit: typeforce.BufferN(20),
  Hash256bit: typeforce.BufferN(32),
  Network: Network,
  Satoshi: Satoshi,
  UInt31: UInt31
}

for (const typeName in typeforce) {
  types[typeName] = typeforce[typeName]
}

export default types
