const bip32 = require('bip32')
const { crypto } = require('../../../lib/crypto')
const configManager = require('../../../lib/managers/config')
const network = require('../../../lib/networks/ark/mainnet.json')

beforeEach(() => configManager.setConfig(network))

describe('ark-js (BIP32)', () => {
  it('can create a BIP32 wallet external address', () => {
    const path = "m/0'/0/0"
    const root = bip32.fromSeed(Buffer.from('dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', 'hex'))

    const child1 = root.derivePath(path)

    // option 2, manually
    const child2 = root.deriveHardened(0).derive(0).derive(0)

    expect(crypto.getAddress(child1.publicKey.toString('hex'))).toBe('AZXdSTRFGHPokX6yfXTfHcTzzHKncioj31')
    expect(crypto.getAddress(child2.publicKey.toString('hex'))).toBe('AZXdSTRFGHPokX6yfXTfHcTzzHKncioj31')
  })

  it('can create a BIP44, ark, account 0, external address', () => {
    /* eslint quotes: ["error", "single", { avoidEscape: true }] */
    const path = "m/44'/0'/0'/0/0"
    const root = bip32.fromSeed(Buffer.from('dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', 'hex'))

    const child1 = root.derivePath(path)

    // option 2, manually
    const child2 = root.deriveHardened(44)
      .deriveHardened(0)
      .deriveHardened(0)
      .derive(0)
      .derive(0)

    expect(crypto.getAddress(child1.publicKey.toString('hex'))).toBe('AVbXc2KyxtXeAP9zQpp7ixsnaxEEQ6wZbq')
    expect(crypto.getAddress(child2.publicKey.toString('hex'))).toBe('AVbXc2KyxtXeAP9zQpp7ixsnaxEEQ6wZbq')
  })
})
