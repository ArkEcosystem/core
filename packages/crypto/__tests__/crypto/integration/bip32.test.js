const assert = require('assert')
const bigi = require('bigi')
const ecurve = require('ecurve')
const crypto = require('crypto')

const HDNode = require('../../../lib/crypto/hdnode')
const { HIGHEST_BIT } = require('../../../lib/crypto/hdnode/constants')
const ECPair = require('../../../lib/crypto/ecpair')
const configManager = require('../../../lib/managers/config')
const network = require('../../../lib/networks/phantom/mainnet.json')

beforeEach(() => configManager.setConfig(network))

describe('phantom-js (BIP32)', () => {
  it('can create a BIP32 wallet external address', () => {
    const path = "m/0'/0/0"
    const root = HDNode.fromSeedHex('dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd')

    const child1 = root.derivePath(path)

    // option 2, manually
    const child2 = root.deriveHardened(0).derive(0).derive(0)

    expect(child1.getAddress()).toBe('AZXdSTRFGHPokX6yfXTfHcTzzHKncioj31')
    expect(child2.getAddress()).toBe('AZXdSTRFGHPokX6yfXTfHcTzzHKncioj31')
  })

  it('can create a BIP44, phantom, account 0, external address', () => {
    /* eslint quotes: ["error", "single", { avoidEscape: true }] */
    const path = "m/44'/0'/0'/0/0"
    const root = HDNode.fromSeedHex('dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd')

    const child1 = root.derivePath(path)

    // option 2, manually
    const child2 = root.deriveHardened(44)
      .deriveHardened(0)
      .deriveHardened(0)
      .derive(0)
      .derive(0)

    expect(child1.getAddress()).toBe('AVbXc2KyxtXeAP9zQpp7ixsnaxEEQ6wZbq')
    expect(child2.getAddress()).toBe('AVbXc2KyxtXeAP9zQpp7ixsnaxEEQ6wZbq')
  })

  it('can recover a BIP32 parent private key = require(the parent public key, and a derived, non-hardened child private key', () => {
    function recoverParent (master, child) {
      assert(!master.keyPair.d, 'You already have the parent private key')
      assert(child.keyPair.d, 'Missing child private key')

      const curve = ecurve.getCurveByName('secp256k1')
      const QP = master.keyPair.Q
      const serQP = master.keyPair.getPublicKeyBuffer()

      const d1 = child.keyPair.d
      let d2
      const data = Buffer.alloc(37)
      serQP.copy(data, 0)

      // search index space until we find it
      for (let i = 0; i < HIGHEST_BIT; ++i) {
        data.writeUInt32BE(i, 33)

        // calculate I
        const I = crypto.createHmac('sha512', master.chainCode).update(data).digest()
        const IL = I.slice(0, 32)
        const pIL = bigi.fromBuffer(IL)

        // See hdnode.js:273 to understand
        d2 = d1.subtract(pIL).mod(curve.n)

        const Qp = new ECPair(d2).Q
        if (Qp.equals(QP)) break
      }

      let node = new HDNode(new ECPair(d2), master.chainCode, master.network)
      node.depth = master.depth
      node.index = master.index
      node.masterFingerprint = master.masterFingerprint
      return node
    }

    const seed = crypto.randomBytes(32)
    const master = HDNode.fromSeedBuffer(seed)
    const child = master.derive(6) // m/6

    // now for the recovery
    const neuteredMaster = master.neutered()
    const recovered = recoverParent(neuteredMaster, child)
    expect(recovered.toBase58()).toBe(master.toBase58())
  })
})
