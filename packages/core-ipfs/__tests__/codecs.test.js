const IPFSManager = require('../lib/manager')
const constants = require('../lib/constants')

let manager = new IPFSManager({})

describe('get all codecs', () => {
  it('should retrieve all available codecs', () => {
    expect(manager.getAllCodecs()).toEqual(constants.codecs)
  })
})

describe('get single codec', () => {
  it('should retrieve ark codec and be base58 btc', () => {
    expect(manager.getCodec('ark')).toEqual(constants.codecs.base58btc)
  })
})
