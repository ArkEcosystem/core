const Bignum = require('../../../lib/utils/bignum')
const handler = require('../../../lib/handlers/transactions/multi-signature')
const WalletModel = require('../../../lib/models/wallet')

let wallet
let transaction

const multisignatureTest = {
  min: 15,
  lifetime: 72,
  keysgroup: [
    '034a7aca6841cfbdc688f09d55345f21c7ffbd1844693fa68d607fc94f729cbbea',
    '02fd6743ddfdc7c5bac24145e449c2e4f2d569b5297dd7bf088c3bc219f582a2f0',
    '02f9c51812f4be127b9f1f21cb4e146eca6aecc85739a243db0f1064981deda216',
    '0214d60ca95cd87a097ed6e6e42281acb68ae1815c8f494b8ff18d24dc9e072171',
    '02a14634e04e80b05acd56bc361af98498d76fbf5233f8d62773ceaa07172ddaa6',
    '021a9ba0e72f02b8fa7bad386582ec1d6c05b7664c892bf2a86035a85350f37203',
    '02e3ba373c6c352316b748e75358ead36504b0ef5139d215fb6a83a330c4eb60d5',
    '0309039bfa18d6fd790edb79438783b27fbcab06040a2fdaa66fb81ad53ca8db5f',
    '0393d12aff5962fa9065487959719a81c5d991e7c48a823039acd9254c2b673841',
    '03d3265264f06fe1dd752798403a73e537eb461fc729c83a84b579e8434adfe7c4',
    '02acfa496a6c12cb9acc3219993b17c62d19f4b570996c12a37d6e89eaa9716859',
    '03136f2101f1767b0d63d9545410bcaf3a941b2b6f06851093f3c679e0d31ca1cd',
    '02e6ec3941be86177bf0b998589c07da1b73e990466fdaee347c972c10f61b3797',
    '037dcd05d921a9f2ddd11960fec2ea9904fc55cad030549a6c5f5a41b2e35e56d2',
    '03206f7ae26f14cffb62b8c28b5e632952cdeb84b7c74ac0c2198b08bd84ee4f23'
  ]
}

beforeEach(() => {
  wallet = new WalletModel('D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7')
  wallet.balance = new Bignum(100390000000)
  wallet.publicKey = '026f717e50bf3dbb9d8593996df5435ba22217410fc7a132f3d2c942a01a00a202'
  wallet.secondPublicKey = '0380728436880a0a11eadf608c4d4e7f793719e044ee5151074a5f2d5d43cb9066'
  wallet.multisignature = multisignatureTest

  transaction = {
    version: 1,
    id: 'e22ddd7385b42c00f79b9c6ecd253333ddef6e0bf955341ace2e63dad1f4bd70',
    type: 4,
    timestamp: 48059808,
    amount: Bignum.ZERO,
    fee: new Bignum(8000000000),
    recipientId: 'DGN48KSVFx88chiSu7JbqkAXstqtM1uLJQ',
    senderPublicKey: '026f717e50bf3dbb9d8593996df5435ba22217410fc7a132f3d2c942a01a00a202',
    signature: '30450221008baddfae37be66d725e22d9e93c10334d859558f2aef38762803178dbb39354f022025a9bdc7fc4c86d3f67cd1d012dbee3d5691ab3188b5457fdeae82fdd5995767', // eslint-disable-line max-len
    signSignature: '3045022100eb9844a235309309f805235ec40336260cc3dc2c3cbb4cb687dd55b32d8f405402202a98ca5b3b2ad31cec0ed01d9c085a828dd5c07c3893858d4c127fce57d6d410', // eslint-disable-line max-len
    signatures: [
      '3045022100f073a3f59ed753f98734462dbe7c9082bb7cb9d46348c671708c93df2fdd2a7602206dc19039d3561f8d1226755dd3b0ca25f359347729eff066eaf3cc3b5c18bc59',
      '3045022100c560d6d8504b6761245f7bb3e3b723380b50c380ae30c9544c781f3a9b1359a702206b50506ba6c0a39bed7bec226b55bf9ece979716eb95e2a757f025d3592fde17',
      '30440220344345bcb9754ab242dc27bd3d705e5213597914183818005ff1f2e91466f17a0220474c27d05cd5f121c3cad0295e6fc9f8a8cdfa03647e70eb3783e4c1139dde04',
      '3045022100998e29255a8f1c140aa41d93ec43271fd8d0e5b9c18df366e3c7b59cc0c293d902205292dd36e9db18f072f00559267361b9426ab26bff2ee613ec0c3627317b4dab',
      '3044022007379b5643032d9e9d3395298776be041b2a85a211be2d7b6a5855cf030ae0ca02203c5d3da458034483fdef9f43ee4db4428999cfeb8893795f695e663407238090',
      '3044022060461195aeb4386dfab1e3618cdec48f4b988ea394461962379cdbfe8f17b7110220415522adf0239bff7e44e6c0cc8d57211d9d9fe745a6ba2911a81586d5dfc5dc',
      '3044022057355ab8ad9502745895a649aede98dfe829c46465eda57438720baeaa6ece5c02200ed3c2eb019579b243380ac066d691f6f27012dc6b93a1403e1a49c992cc0812',
      '3044022010cf1079e46cbac198e49f763795095c3a1f33b772cf3e6f335c313f786eb0570220450a110a813cc5453265f0e97850794b0f9d5c6efd6d9ea08009df3d4b9f2299',
      '3044022000f35223b23f03413f17538b157e62388c0b150fc046fdcc35792a48d694499402205c2e494ca74565e7841cd6034228cd3d9b57bb832f0da5834991bf92b415c0b8',
      '304402206b69cbd52335fca4a510fa1dcb1417617ad1128aa06dcf543d1f11890e46fdef022012d3054adc0a924429d34091910bf82c0abc757f39cfc0887c7e4d9b35f21ad6',
      '30440220490bf3e963aa500404e5d559dc06bb1ce176ddbab92f46add87c17c19c3781c90220775f0a3f65d95e3e268eb1f2f2fc86044995e7ebdd1f51f99a973fd00c952d57',
      '30450221008795d2e1a454c2cbda92d5fcb7e539372cefbe9f8a181d658abcbd2ba18da8e702207b395488d31f037dc158c12799885edb94f36b1437b2bda79d9074c9a82aa686',
      '3045022100cf706e93a9984a958dba6e17287d17febae005d277afc77890e0a3912ee7ed3d02206618718ee68cae209c42a801b7b295fa2564878838712a1b22beaa3637b57c58',
      '30440220743aba2fdb663dda73b64ada17812a98adf26f2419c6ab2cfba8f66666527a91022036ade1b37b72079eb43b51a8fe5e31da2e42f7b6d0b437f8a693cc276b9123b8',
      '304402206902fc8f519670a7768ad13f1b2d69373aa14c89b70020f83273d6bb0cfd89d102207de30b9ac0c17ff11e364b72c41f1cd8d4e6dccbe28399cb78e96eea32deef12'
    ],
    asset: {
      multisignature: {
        min: 15,
        lifetime: 72,
        keysgroup: [
          '+0217e9e2a1aca300a7011acaadf60af94252875568373546895f227c050d48aac5',
          '+02b3b3233c171a122f88c1dbe44539dfefb36530ca3ec04163aef9f448a1823795',
          '+03a3013f144160e1964b97e78117571e571a631f0042efcd0de309c7159c7886c8',
          '+02fb475ef881b8f56e00407095a87319934c34467db11d3230e54d9328c6cddbe5',
          '+03ab9cc2c5364f1676a94b2b5ff3fbc3705e8ce94c6e7e4712890905addf765a3f',
          '+024be9e731a63f86b56e5f48dbdfb3443a0628c82ea308ee4c88d3fcbe3183eb9d',
          '+0371b8fd17fb1f31095e8a1586bbe29e205904c9100de07c84090a423929a20dcf',
          '+02cc09a7c5560db72e312f58a9f5ca4b60b5109efc5ce9dd58a116fa16516bb493',
          '+02145fbe9309ebb1547eb332686efb4d8b6e2aaa1fe636663bf6ab1000e5cf72d3',
          '+0274966781d4d23f8991530b33bdb051905cde809ae52e58e45cfd1bc8f6f70cc6',
          '+0347288f8db9be069415c6c97fd4825867f4bd9b9f78557e8aa1244890beb85001',
          '+035359097c405e90516be78104de0ca17001da2826397e0937b8b1e8e613fff352',
          '+021aa343234514f8fdaf5e668bdc822a42805382567fa2ca9a5e06e92065f5658a',
          '+033a28a0a9592952336918ddded08dd55503b82852fe67df1d358f07a575910844',
          '+02747bec17b02cc09345c8c0dbeb09bff2db74d1c355135e10af0001eb1dc00265'
        ]
      }
    },
    confirmations: 1091040
  }
})

describe('MultiSignatureHandler', () => {
  it('should be instantiated', () => {
    expect(handler.constructor.name).toBe('MultiSignatureHandler')
  })

  describe('canApply', () => {
    it('should be a function', () => {
      expect(handler.canApply).toBeFunction()
    })

    it('should be ok', () => {
      delete wallet.multisignature

      expect(handler.canApply(wallet, transaction)).toBeTrue()
    })

    it('should not be ok', () => {
      wallet.multisignature = multisignatureTest

      expect(handler.canApply(wallet, transaction)).toBeFalse()
    })
  })

  describe('apply', () => {
    it('should be a function', () => {
      expect(handler.apply).toBeFunction()
    })

    it('should be ok', () => {
      wallet.multisignature = null

      expect(wallet.multisignature).toBeNull()

      handler.apply(wallet, transaction)

      expect(wallet.multisignature).toEqual(transaction.asset.multisignature)
    })
  })

  describe('revert', () => {
    it('should be a function', () => {
      expect(handler.revert).toBeFunction()
    })

    it('should be ok', () => {
      handler.revert(wallet, transaction)

      expect(wallet.multisignature).toBeNull()
    })
  })
})
