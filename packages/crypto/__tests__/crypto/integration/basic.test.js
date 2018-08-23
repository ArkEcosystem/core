const bigi = require('bigi')
const utils = require('../../../lib/crypto/utils')
const ECPair = require('../../../lib/crypto/ecpair')

const configManager = require('../../../lib/managers/config')
const network = require('../../../lib/networks/phantom/mainnet.json')

beforeEach(() => configManager.setConfig(network))

describe('Basic Crypto', () => {
  it('can generate a random phantom address', () => {
    const keyPair = ECPair.makeRandom({
      rng: () => Buffer.from('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz')
    })

    expect(keyPair.getAddress()).toBe('ANoMWEJ9jSdE2FgohBLLXeLzci59BDFsP4')
  })

  it('can generate an address = require(a SHA256 hash', () => {
    const hash = utils.sha256('correct horse battery staple')
    const keyPair = new ECPair(bigi.fromBuffer(hash))

    expect(keyPair.getAddress()).toBe('AG5AtmiNbgv51eLwAWnRGvkMudVd7anYP2')
  })

  it('can generate a random keypair for alternative networks', () => {
    const keyPair = ECPair.makeRandom({
      network,
      rng: () => Buffer.from('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz')
    })

    expect(keyPair.getAddress()).toBe('ANoMWEJ9jSdE2FgohBLLXeLzci59BDFsP4')
    expect(keyPair.toWIF()).toBe('SDgGxWHHQHnpm5sth7MBUoeSw7V7nbimJ1RBU587xkryTh4qe9ov')
  })

  it('can const an address via WIF', () => {
    const keyPair = ECPair.fromWIF('SDgGxWHHQHnpm5sth7MBUoeSw7V7nbimJ1RBU587xkryTh4qe9ov')

    expect(keyPair.getAddress()).toBe('ANoMWEJ9jSdE2FgohBLLXeLzci59BDFsP4')
  })
})
