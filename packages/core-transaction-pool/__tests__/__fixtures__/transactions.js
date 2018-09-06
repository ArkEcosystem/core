const { Transaction } = require('@arkecosystem/crypto').models

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

exports.dynamicFeeNormalDummy1 = new Transaction({
  type: 0,
  amount: 200000000,
  fee: 270000,
  recipientId: 'AcjGpvDJEQdBVwspYsAs16B8Rv66zo7gyd',
  timestamp: 45947670,
  asset: {},
  vendorField: 'TID: 0',
  senderPublicKey: '03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357',
  signature: '304402201ecbac2760492934873a13fdc7287958f464f4ee95fc13d4370a6a7c4351b2e902200ff75120a1663ab65eeb7a1795ad7c855363a0b61028751fcc2e7848b262df44',
  id: 'b6d993f3294b2aee7c077cd15c2c54912427412fb4be291a559c93f51cf7e4cd'
})

exports.dynamicFeeLowDummy2 = new Transaction({
  type: 0,
  amount: 200000000,
  fee: 100,
  recipientId: 'AabMvWPVKbdTHRcGBpATq9TEMiMD5xeJh9',
  timestamp: 45947828,
  asset: {},
  vendorField: 'TID: 0',
  senderPublicKey: '03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357',
  signature: '3045022100a8754cee4492f30efa61825f39cda1a0de44b3d8e909b6c7e9055d7bc923b6d402200fab8abb348b4f5c7aaf10a9bb5451021e0e0e1fbb2f995555740b6d4ef8ccfe',
  id: 'f7c7f073735d6900b4d12c70f75d7d1ad5ba41715d2254f50bf057580e05f7ec'
})

exports.dynamicFeeOverTheTop = new Transaction({
  type: 0,
  amount: 200000000,
  fee: 50000000000,
  recipientId: 'AMPNLByignv9jLbA4A2E1DuhPr1YGFW3z8',
  timestamp: 45948058,
  asset: {},
  vendorField: 'TID: 0',
  senderPublicKey: '03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357',
  signature: '304402204734394ed01931a379539ca310c942b35be8c86b7e3d519a687f41e511c70f4102200f7cae2c32ce7fe2f92fc1c711e63860fd933abd05b01a4a47a2ee51e9d5c418',
  id: 'c367602ee4914f259e7397c677266e72bfdd4438f5829babddd8d851045e7b0b'
})

exports.dynamicFeeZero = new Transaction({
  type: 0,
  amount: 200000000,
  fee: 0,
  recipientId: 'AVnRZSvrAeeSJZN3oSBxEF6mvvVpuKUXL5',
  timestamp: 45948315,
  asset: {},
  vendorField: 'TID: 0',
  senderPublicKey: '03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357',
  signature: '304402206119b9bfd045b0faa89436e4e487ff3e33aac310cea93f6e2870067ef42cc7e402204ccfc4756432901723fb70d98863adcf26f6e9ea963ba6f4063a886f44b82cb7',
  id: '9966cc7fa7c646ab5771335809acb4a98c0c13c9045fa7976a1065f3a77c1721'
})

exports.dynamicFeeNegative = new Transaction({
  type: 0,
  amount: 200000000,
  fee: -150,
  recipientId: 'AVnRZSvrAeeSJZN3oSBxEF6mvvVpuKUXL5',
  timestamp: 45948315,
  asset: {},
  vendorField: 'TID: 0',
  senderPublicKey: '03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357',
  signature: '304402206119b9bfd045b0faa89436e4e487ff3e33aac310cea93f6e2870067ef42cc7e402204ccfc4756432901723fb70d98863adcf26f6e9ea963ba6f4063a886f44b82cb7',
  id: '9966cc7fa7c646ab5771335809acb4a98c0c13c9045fa7976a1065f3a77c1721'
})
