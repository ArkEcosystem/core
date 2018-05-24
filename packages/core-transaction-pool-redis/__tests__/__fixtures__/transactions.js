const ark = require('@arkecosystem/crypto')
const { slots } = ark
const { Transaction } = ark.models

exports.dummy1 = new Transaction({
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
})

exports.dummy2 = new Transaction({
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
})

exports.dummyExp1 = new Transaction({
  version: 1,
  network: 23,
  type: 0,
  timestamp: slots.getTime(),
  senderPublicKey: '03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357',
  fee: 20000000,
  vendorFieldHex: '5449443a2030',
  amount: 200000000,
  expiration: (slots.getTime() + 5),
  recipientId: 'AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5',
  signature: '304502210096ec6e27176fa694638d6fff35d7a551b2ed8c479a7e03264026eea41a05edd702206c071c97d1c6cc3bfec64dfff808cb0d5dfe857803428efb80bf7717b85cb619',
  vendorField: 'Expiring transaction 1'
})

exports.dummyExp2 = new Transaction({
  version: 1,
  network: 30,
  type: 0,
  timestamp: slots.getTime(),
  senderPublicKey: '0310c283aac7b35b4ae6fab201d36e8322c3408331149982e16013a5bcb917081c',
  fee: 10000000,
  amount: 20000000,
  expiration: (slots.getTime() + 5),
  recipientId: 'DFyDKsyvR4x9D9zrfEaPmeJxSniT5N5qY8',
  signature: '3045022100ead721ae139c0a18a7be2077453337f8305e02a474a3e4e35eb22bcf59ce474c02207ea591ac68b5cfee068ac605efb000c7e1e7479abc7f6ee7ece21f3a5c629800',
  secondSignature: '3044022006bd359a6820353e5e2f28adc0569f79ee7ed2918ee169bb149ca582f613fa760220502f39db1f9568edeb05df08d570a21a8204cb66f993f7cea6554a3298c548be',
  signSignature: '3044022006bd359a6820353e5e2f28adc0569f79ee7ed2918ee169bb149ca582f613fa760220502f39db1f9568edeb05df08d570a21a8204cb66f993f7cea6554a3298c548be',
  vendorField: 'Expiring transaction 2'
})
