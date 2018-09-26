require('../../../lib/matchers/models/transaction')

const transaction = {
  version: 1,
  network: 23,
  type: 0,
  timestamp: 35672738,
  senderPublicKey: '03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357',
  fee: 10000000,
  vendorFieldHex: '5449443a2030',
  amount: 200000000,
  expiration: 0,
  recipientId: 'AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5',
  signature: '304502210096ec6e27176fa694638d6fff35d7a551b2ed8c479a7e03264026eea41a05edd702206c071c97d1c6cc3bfec64dfff808cb0d5dfe857803428efb80bf7717b85cb619',
  vendorField: 'TID: 0',
  id: 'a5e9e6039675563959a783fa672c0ffe65369168a1ecffa3c89bf82961d8dbad'
}

describe('.toBeTransaction', () => {
  test('passes when given a valid transaction', () => {
    expect(transaction).toBeTransaction()
  })

  test('fails when given an invalid transaction', () => {
    expect({ fake: 'news' }).not.toBeTransaction()
  })
})
