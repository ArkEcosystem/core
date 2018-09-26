const { NetworkManager } = require('@arkecosystem/crypto')

require('../../../lib/matchers/transactions/valid-second-signature')

const transaction = {
  version: 1,
  network: 30,
  type: 0,
  timestamp: 35632190,
  senderPublicKey: '0310c283aac7b35b4ae6fab201d36e8322c3408331149982e16013a5bcb917081c',
  fee: 10000000,
  amount: 10000000,
  expiration: 0,
  recipientId: 'DFyDKsyvR4x9D9zrfEaPmeJxSniT5N5qY8',
  signature: '3045022100ead721ae139c0a18a7be2077453337f8305e02a474a3e4e35eb22bcf59ce474c02207ea591ac68b5cfee068ac605efb000c7e1e7479abc7f6ee7ece21f3a5c629800',
  secondSignature: '3044022006bd359a6820353e5e2f28adc0569f79ee7ed2918ee169bb149ca582f613fa760220502f39db1f9568edeb05df08d570a21a8204cb66f993f7cea6554a3298c548be',
  signSignature: '3044022006bd359a6820353e5e2f28adc0569f79ee7ed2918ee169bb149ca582f613fa760220502f39db1f9568edeb05df08d570a21a8204cb66f993f7cea6554a3298c548be',
  id: 'e665f6634fdbbbc562f79b92c8f0acd621081680c247cb4a6fc987bf456ea554'
}

describe.skip('.toHaveValidSecondSignature', () => {
  test('passes when given a valid transaction', () => {
    expect(transaction).toHaveValidSecondSignature({
      publicKey: transaction.senderPublicKey,
      network: NetworkManager.findByName('devnet')
    })
  })

  test('fails when given an invalid transaction', () => {
    transaction.secondSignature = 'invalid'

    expect(transaction).not.toHaveValidSecondSignature({
      publicKey: transaction.senderPublicKey,
      network: NetworkManager.findByName('devnet')
    })
  })
})
