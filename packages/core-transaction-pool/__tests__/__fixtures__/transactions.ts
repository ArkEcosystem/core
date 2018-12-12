/*tslint:disable:max-line-length */
import { models, slots } from "@arkecosystem/crypto";
const { Transaction } = models;

export const transactions = {
    dummy1: new Transaction({
        version: 1,
        network: 23,
        type: 0,
        timestamp: 35672738,
        senderPublicKey: "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
        fee: 10000000,
        vendorFieldHex: "5449443a2030",
        amount: 200000000,
        expiration: 0,
        recipientId: "AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5",
        signature:
            "304502210096ec6e27176fa694638d6fff35d7a551b2ed8c479a7e03264026eea41a05edd702206c071c97d1c6cc3bfec64dfff808cb0d5dfe857803428efb80bf7717b85cb619",
        vendorField: "TID: 0",
        id: "a5e9e6039675563959a783fa672c0ffe65369168a1ecffa3c89bf82961d8dbad",
    }),

    dummy2: new Transaction({
        version: 1,
        network: 30,
        type: 0,
        timestamp: 35632190,
        senderPublicKey: "0310c283aac7b35b4ae6fab201d36e8322c3408331149982e16013a5bcb917081c",
        fee: 10000000,
        amount: 10000000,
        expiration: 0,
        recipientId: "DFyDKsyvR4x9D9zrfEaPmeJxSniT5N5qY8",
        signature:
            "3045022100ead721ae139c0a18a7be2077453337f8305e02a474a3e4e35eb22bcf59ce474c02207ea591ac68b5cfee068ac605efb000c7e1e7479abc7f6ee7ece21f3a5c629800",
        id: "e665f6634fdbbbc562f79b92c8f0acd621081680c247cb4a6fc987bf456ea554",
    }),

    dummy3: new Transaction({
        version: 1,
        type: 0,
        amount: 200000000,
        fee: 10000000,
        recipientId: "ANqvJEMZcmUpcKBC8xiP1TntVkJeuZ3Lw3",
        timestamp: 37346710,
        asset: {},
        vendorField: "TID: 0",
        senderPublicKey: "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
        signature:
            "304402203f4d2b11b6f05538b16e2ab314c3c158885d8ceb95f3c0237d00fb350ea1b8e7022052eb7a2cd35c0d91ac14a8cba32b14a744ef26fc7d4c63b66d55f3ade0d6c305",
        id: "b163572af7598e35b4ea51e92cd1b59c8d653a50fc21358a7690777cc793cc50",
    }),

    dummy4: new Transaction({
        version: 1,
        type: 0,
        amount: 200000000,
        fee: 10000000,
        recipientId: "AJ5eV59hu4xrbRCpoP3of7fEYWUteSVa8k",
        timestamp: 37346710,
        asset: {},
        vendorField: "TID: 1",
        senderPublicKey: "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
        signature:
            "30450221008e04e622578bb6ac55097c9af3b7ffb553b659900f58056dae6ff2d57b0630000220071f416401431ba375f3f1a345b5f98deddd2198f072af4746a78417f8ece47d",
        id: "03ebe9fd182e2ac19244a80717428b5ded0c2e7692f7f503f1acea0ea285ded9",
    }),

    dummy5: new Transaction({
        version: 1,
        type: 0,
        amount: 200000000,
        fee: 10000000,
        recipientId: "ASvC1E9hMLfANTi63S2gUMvr7rVZYJBj3u",
        timestamp: 37346710,
        asset: {},
        vendorField: "TID: 2",
        senderPublicKey: "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
        signature:
            "304502210095e699ae51090076180ead5623059ad0e607f08cf2a56b6a214817ec08610fd6022041ab05fe8acffdf0e4ed265d062411b2d3e47cf0f76b22793aee6ba12b17042c",
        id: "b1b89654cabf06fd2db8aa0b3659efcbf7430d1223bae0d8a23f6fad0983b032",
    }),

    dummy6: new Transaction({
        version: 1,
        type: 0,
        amount: 200000000,
        fee: 10000000,
        recipientId: "Ac8utEr7XRebWRvArSBnbVoxbq6bXftAmL",
        timestamp: 37346710,
        asset: {},
        vendorField: "TID: 3",
        senderPublicKey: "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
        signature:
            "304402203388ae5ba8f6248545593e7b4401900ca47dc5d694f5c36c8e1dafa67f1e214a02204a5e0cb620f0229cd0059675c8e2e3d835621eb682dc77f993acf5345a2f2bc7",
        id: "937cb5431352100d60b5a6e9d5bb487c1276c1dee7ab75a238ca98daca35d236",
    }),

    dummy7: new Transaction({
        version: 1,
        type: 0,
        amount: 200000000,
        fee: 10000000,
        recipientId: "ANWEaVfvAh3VTyZNYcuFESUum1XBmAvAdj",
        timestamp: 37346710,
        asset: {},
        vendorField: "TID: 4",
        senderPublicKey: "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
        signature:
            "304502210093b9cf39802eff75d1f16c5f1de5a4326c77c73153e9cb87cfeb81f00b59a06402200b5375046043f0839bcdc2c3f972728241fb04fdacf3a669b12f2ec47c962d23",
        id: "d14ebba264bc6056acc5593c5c6d5566ae7bbd688556386e9e70ab33eb6e3e9c",
    }),

    dummy8: new Transaction({
        version: 1,
        type: 0,
        amount: 200000000,
        fee: 10000000,
        recipientId: "ALsZS24Dn4HYXwed5kAC5fKyB9BFzdmcSx",
        timestamp: 37346710,
        asset: {},
        vendorField: "TID: 5",
        senderPublicKey: "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
        signature:
            "30450221008425a7283e921d956a86db10bb34666deea9c13fa204420c4a85e2482399cce50220476bfdddc0743a0e05730e1b056a5a1d1030a963241ceced24da41ade6e6d2c9",
        id: "7cf2325af89cdd7ac0b75e45a98ef1a30e8ee83842afeec27f22e695bf01f0ce",
    }),

    dummy9: new Transaction({
        version: 1,
        type: 0,
        amount: 200000000,
        fee: 10000000,
        recipientId: "ANuaLhRuBJhTcHao7kTfDcfsewLQGr7x5G",
        timestamp: 37346710,
        asset: {},
        vendorField: "TID: 6",
        senderPublicKey: "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
        signature:
            "3045022100f6571a7da13e81053e3cf39262b0dba7c476e589ae0c30ea7fb46bdff22dbd05022015c528cf9e8aacd986bb20b81420bf8eb7fd235a51f37193a8488f060a884267",
        id: "6cc8e7d4ea99198dee4bed393e77828da8302619b27064933c0487c9dbb48e78",
    }),

    dummy10: new Transaction({
        version: 1,
        network: 30,
        type: 0,
        timestamp: slots.getTime(),
        senderPublicKey: "0310c283aac7b35b4ae6fab201d36e8322c3408331149982e16013a5bcb917081c",
        fee: 10000000,
        amount: 20000000,
        recipientId: "DFyDKsyvR4x9D9zrfEaPmeJxSniT5N5qY8",
        signature:
            "3045022100ead721ae139c0a18a7be2077453337f8305e02a474a3e4e35eb22bcf59ce474c02207ea591ac68b5cfee068ac605efb000c7e1e7479abc7f6ee7ece21f3a5c629800",
        vendorField: "Expiring transaction 2",
    }),

    dummyExp1: new Transaction({
        version: 1,
        network: 23,
        type: 0,
        timestamp: slots.getTime(),
        senderPublicKey: "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
        fee: 20000000,
        vendorFieldHex: "5449443a2030",
        amount: 200000000,
        expiration: slots.getTime() + 5,
        recipientId: "AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5",
        signature:
            "304502210096ec6e27176fa694638d6fff35d7a551b2ed8c479a7e03264026eea41a05edd702206c071c97d1c6cc3bfec64dfff808cb0d5dfe857803428efb80bf7717b85cb619",
        vendorField: "Expiring transaction 1",
    }),

    dummyExp2: new Transaction({
        version: 1,
        network: 30,
        type: 0,
        timestamp: slots.getTime(),
        senderPublicKey: "0310c283aac7b35b4ae6fab201d36e8322c3408331149982e16013a5bcb917081c",
        fee: 10000000,
        amount: 20000000,
        expiration: slots.getTime() + 5,
        recipientId: "DFyDKsyvR4x9D9zrfEaPmeJxSniT5N5qY8",
        signature:
            "3045022100ead721ae139c0a18a7be2077453337f8305e02a474a3e4e35eb22bcf59ce474c02207ea591ac68b5cfee068ac605efb000c7e1e7479abc7f6ee7ece21f3a5c629800",
        vendorField: "Expiring transaction 2",
    }),

    dynamicFeeNormalDummy1: new Transaction({
        type: 0,
        amount: 200000000,
        fee: 270000,
        recipientId: "AcjGpvDJEQdBVwspYsAs16B8Rv66zo7gyd",
        timestamp: 45947670,
        asset: {},
        vendorField: "TID: 0",
        senderPublicKey: "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
        signature:
            "304402201ecbac2760492934873a13fdc7287958f464f4ee95fc13d4370a6a7c4351b2e902200ff75120a1663ab65eeb7a1795ad7c855363a0b61028751fcc2e7848b262df44",
        id: "b6d993f3294b2aee7c077cd15c2c54912427412fb4be291a559c93f51cf7e4cd",
    }),

    dynamicFeeLowDummy2: new Transaction({
        type: 0,
        amount: 200000000,
        fee: 100,
        recipientId: "AabMvWPVKbdTHRcGBpATq9TEMiMD5xeJh9",
        timestamp: 45947828,
        asset: {},
        vendorField: "TID: 0",
        senderPublicKey: "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
        signature:
            "3045022100a8754cee4492f30efa61825f39cda1a0de44b3d8e909b6c7e9055d7bc923b6d402200fab8abb348b4f5c7aaf10a9bb5451021e0e0e1fbb2f995555740b6d4ef8ccfe",
        id: "f7c7f073735d6900b4d12c70f75d7d1ad5ba41715d2254f50bf057580e05f7ec",
    }),

    dynamicFeeZero: new Transaction({
        type: 0,
        amount: 200000000,
        fee: 0,
        recipientId: "AVnRZSvrAeeSJZN3oSBxEF6mvvVpuKUXL5",
        timestamp: 45948315,
        asset: {},
        vendorField: "TID: 0",
        senderPublicKey: "03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357",
        signature:
            "304402206119b9bfd045b0faa89436e4e487ff3e33aac310cea93f6e2870067ef42cc7e402204ccfc4756432901723fb70d98863adcf26f6e9ea963ba6f4063a886f44b82cb7",
        id: "9966cc7fa7c646ab5771335809acb4a98c0c13c9045fa7976a1065f3a77c1721",
    }),
};
