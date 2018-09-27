const bip32 = require('bip32')
const { crypto, hdwallet } = require('../../lib/crypto')
const configManager = require('../../lib/managers/config')
const network = require('../../lib/networks/ark/mainnet.json')

const mnemonic = 'sorry hawk one science reject employ museum ride into post machine attack bar seminar myself unhappy faculty differ grain fish chest bird muffin mesh'

beforeEach(() => configManager.setConfig(network))

describe('HDWallet', () => {
  describe('bip32', () => {
    it('can create a BIP32 wallet external address', () => {
      const path = "m/0'/0/0"
      const root = bip32.fromSeed(Buffer.from('dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', 'hex'))

      const child1 = root.derivePath(path)

      // option 2, manually
      const child2 = root.deriveHardened(0).derive(0).derive(0)

      expect(crypto.getAddress(child1.publicKey.toString('hex'))).toBe('AZXdSTRFGHPokX6yfXTfHcTzzHKncioj31')
      expect(crypto.getAddress(child2.publicKey.toString('hex'))).toBe('AZXdSTRFGHPokX6yfXTfHcTzzHKncioj31')
    })
  })

  describe('bip44', () => {
    it('can create a BIP44, ark, account 0, external address', () => {
      /* eslint quotes: ["error", "single", { avoidEscape: true }] */
      const path = "m/44'/111'/0'/0/0"
      const root = bip32.fromSeed(Buffer.from('dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', 'hex'))

      const child1 = root.derivePath(path)

      // option 2, manually
      const child2 = root.deriveHardened(44)
        .deriveHardened(111)
        .deriveHardened(0)
        .derive(0)
        .derive(0)

      expect(crypto.getAddress(child1.publicKey.toString('hex'))).toBe('AKdstZSrxzeF54e1M41fQzqGqjod9ydG3E')
      expect(crypto.getAddress(child2.publicKey.toString('hex'))).toBe('AKdstZSrxzeF54e1M41fQzqGqjod9ydG3E')
    })
  })

  describe('fromMnemonic', () => {
    it('should be a function', () => {
      expect(hdwallet.fromMnemonic).toBeFunction()
    })

    it('should return the root node', () => {
      const root = hdwallet.fromMnemonic(mnemonic)
      expect(root.constructor.name).toBe('BIP32')
    })

    it('should derive path', () => {
      const root = hdwallet.fromMnemonic(mnemonic)
      const node = root.derivePath("44'/1'/0'/0/0")
      expect(node.publicKey.toString('hex')).toBe('02126148679f22c162afa24a264a6b6722a61aab622248f2f536da289f48a9291f')
      expect(node.privateKey.toString('hex')).toBe('b6f84081b674cf1f765ac182aaabd94d944c367d214263d1f7f3102d1cec98d5')
    })
  })

  describe('getKeys', () => {
    it('should be a function', () => {
      expect(hdwallet.fromKeys).toBeFunction()
    })

    it('should return keys from a node', () => {
      const root = hdwallet.fromMnemonic(mnemonic)
      const node = root.derivePath("44'/1'/0'/0/0")
      const keys = hdwallet.getKeys(node)
      expect(keys.publicKey).toBe('02126148679f22c162afa24a264a6b6722a61aab622248f2f536da289f48a9291f')
      expect(keys.privateKey).toBe('b6f84081b674cf1f765ac182aaabd94d944c367d214263d1f7f3102d1cec98d5')
      expect(keys.compressed).toBeTrue()
    })
  })

  describe('fromKeys', () => {
    it('should be a function', () => {
      expect(hdwallet.fromKeys).toBeFunction()
    })

    it('should return node from keys', () => {
      const keys = {
        publicKey: '',
        privateKey: 'b6f84081b674cf1f765ac182aaabd94d944c367d214263d1f7f3102d1cec98d5',
        compressed: true
      }

      const chainCode = Buffer.from('2bbe729fab21bf8bca70763caf7fe85752726a363b494dea7a65e51e2d423d7b', 'hex')
      const node = hdwallet.fromKeys(keys, chainCode)
      expect(node.publicKey.toString('hex')).toBe('02126148679f22c162afa24a264a6b6722a61aab622248f2f536da289f48a9291f')
      expect(node.privateKey.toString('hex')).toBe('b6f84081b674cf1f765ac182aaabd94d944c367d214263d1f7f3102d1cec98d5')
    })
  })

  describe('deriveSlip44', () => {
    it('should be a function', () => {
      expect(hdwallet.deriveSlip44).toBeFunction()
    })

    it('should derive path', () => {
      const root = hdwallet.fromMnemonic(mnemonic)

      const actual = hdwallet.deriveSlip44(root)
        .deriveHardened(0)
        .derive(0)
        .derive(0)

      const expected = root.deriveHardened(44)
        .deriveHardened(111)
        .deriveHardened(0)
        .derive(0)
        .derive(0)

      expect(crypto.getAddress(actual.publicKey.toString('hex'))).toBe('AHQhEsLWX5BbvvK836f1rUyZZZ77YikYq5')
      expect(actual.publicKey.toString('hex')).toBe('0330d7c2df15da16c72ac524f7548b2bca689beb0527ce54a50d3b79e4e91a8e9b')
      expect(actual.privateKey.toString('hex')).toBe('693bef1f16bad3c8096191af2362dae95873468fc5de30510b61d36fb3f1e33c')

      expect(actual.publicKey).toEqual(expected.publicKey)
      expect(actual.privateKey).toEqual(expected.privateKey)
    })
  })

  describe('deriveNetwork', () => {
    it('should be a function', () => {
      expect(hdwallet.deriveNetwork).toBeFunction()
    })

    it('should derive path', () => {
      const root = hdwallet.fromMnemonic(mnemonic)

      const actual = hdwallet.deriveNetwork(root)
        .deriveHardened(0)
        .derive(0)

      expect(crypto.getAddress(actual.publicKey.toString('hex'))).toBe('AKjBp5V1xG9c5PQqUvtvtoGjvnyA3wLVpA')
      expect(actual.publicKey.toString('hex')).toBe('0281d69cadc9cf1bbbadd69503f071ce5de3826cee702e67a21d86f4fbe2d61b77')
      expect(actual.privateKey.toString('hex')).toBe('de9b9b025d65b61a997c100419df05d1a26a4053f668e42e7ab2747ac6eed997')
    })
  })
})
