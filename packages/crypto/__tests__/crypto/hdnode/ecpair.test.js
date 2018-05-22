const configManager = require('../../../lib/managers/config')
const ECPair = require('../../../lib/crypto/ecpair')
const HDNode = require('../../../lib/crypto/hdnode')
const { NETWORKS } = require('../../utils/network-list')

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
      it('wraps keyPair.getAddress', () => {
        keyPair.getAddress = jest.fn()
        keyPair.getAddress.mockReturnValue('foobar')

        expect(hd.getAddress()).toBe('foobar')

        expect(keyPair.getAddress).toHaveBeenCalledTimes(1)
      })
    })

    describe('getNetwork', () => {
      it('wraps keyPair.getNetwork', () => {
        keyPair.getNetwork = jest.fn()
        keyPair.getNetwork.mockReturnValue('network')

        expect(hd.getNetwork()).toBe('network')

        expect(keyPair.getNetwork).toHaveBeenCalledTimes(1)
      })
    })

    describe('getPublicKeyBuffer', () => {
      it('wraps keyPair.getPublicKeyBuffer', () => {
        keyPair.getPublicKeyBuffer = jest.fn()
        keyPair.getPublicKeyBuffer.mockReturnValue('pubKeyBuffer')

        expect(hd.getPublicKeyBuffer()).toBe('pubKeyBuffer')

        expect(keyPair.getPublicKeyBuffer).toHaveBeenCalledTimes(1)
      })
    })

    describe('sign', () => {
      it('wraps keyPair.sign', () => {
        keyPair.sign = jest.fn()
        keyPair.sign.mockReturnValue('signed')

        expect(hd.sign(hash)).toBe('signed')

        expect(keyPair.sign).toHaveBeenCalledWith(hash)
        expect(keyPair.sign).toHaveBeenCalledTimes(1)
      })
    })

    describe('verify', () => {
      let signature

      beforeEach(() => {
        signature = hd.sign(hash)
      })

      it('wraps keyPair.verify', () => {
        keyPair.verify = jest.fn()
        keyPair.verify.mockReturnValue('verified')

        expect(hd.verify(hash, signature)).toBe('verified')

        expect(keyPair.verify).toHaveBeenCalledWith(hash, signature)
        expect(keyPair.verify).toHaveBeenCalledTimes(1)
      })
    })
  })
})
