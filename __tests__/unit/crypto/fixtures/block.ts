import { Utils } from "@arkecosystem/crypto";

export const dummyBlock = {
    id: "17605317082329008056",
    version: 0,
    height: 1760000,
    timestamp: 62222080,
    previousBlock: "3112633353705641986",
    numberOfTransactions: 7,
    totalAmount: Utils.BigNumber.make("10500000000"),
    totalFee: Utils.BigNumber.make("70000000"),
    reward: Utils.BigNumber.make("200000000"),
    payloadLength: 224,
    payloadHash: "de56269cae3ab156f6979b94a04c30b82ed7d6f9a97d162583c98215c18c65db",
    generatorPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
    blockSignature:
        "30450221008c59bd2379061ad3539b73284fc0bbb57dbc97efd54f55010ba3f198c04dde7402202e482126b3084c6313c1378d686df92a3e2ef5581323de11e74fe07eeab339f3",
    transactions: [
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 62222080,
            senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            fee: Utils.BigNumber.make("10000000"),
            amount: Utils.BigNumber.make("1300000000"),
            expiration: 0,
            recipientId: "DBYyh2vXcigrJGUHfvmYxVxEqeH7vomw6x",
            signature:
                "30440220714c2627f0e9c3bd6bf13b8b4faa5ec2d677694c27f580e2f9e3875bde9bc36f02201c33faacab9eafd799d9ceecaa153e3b87b4cd04535195261fd366e552652549",
            id: "188b4d9d95a58e4e18d9ce9db28f2010323b90b5afd36a474d7ae7bf70772bb0",
            blockId: "17605317082329008056",
            sequence: 0,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 62222080,
            senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            fee: Utils.BigNumber.make("10000000"),
            amount: Utils.BigNumber.make("1700000000"),
            expiration: 0,
            recipientId: "DBYyh2vXcigrJGUHfvmYxVxEqeH7vomw6x",
            signature:
                "3045022100e6039f810684515c0d6b31039040a76c98f3624b6454cb156a0a2137e5f8dba7022001ada19bcca5798e1c7cc8cc39bab5d4019525e3d72a42bd2c4129352b8ead87",
            id: "23084f2cc566f6144a8f447bc784de64a0b0646776060482d8550856145e11e2",
            blockId: "17605317082329008056",
            sequence: 1,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 62222080,
            senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            fee: Utils.BigNumber.make("10000000"),
            amount: Utils.BigNumber.make("1500000000"),
            expiration: 0,
            recipientId: "DBYyh2vXcigrJGUHfvmYxVxEqeH7vomw6x",
            signature:
                "3045022100c2b5ef772b36e468e95ec2e457bfaba7bad0e13b3faf57e229ff5d67a0e017c902202339664595ea5c70ce20e4dd182532f7fa385d86575b0476ff3eda9f9785e1e9",
            id: "743ce0a590c2af90e4734db3630b52d7a7cbc2bc228d75ae6409c0b6d184bfad",
            blockId: "17605317082329008056",
            sequence: 2,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 62222080,
            senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            fee: Utils.BigNumber.make("10000000"),
            amount: Utils.BigNumber.make("1600000000"),
            expiration: 0,
            recipientId: "DBYyh2vXcigrJGUHfvmYxVxEqeH7vomw6x",
            signature:
                "30450221009ceb56688705e6b12000bde726ca123d84982231d7434f059612ff5f987409c602200d908667877c902e7ba35024951046b883e0bce9103d4717928d94ecc958884a",
            id: "877780706b62b437913ef4ea30c6e370f8877ef7a5bac58d8cebca83b7e20060",
            blockId: "17605317082329008056",
            sequence: 3,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 62222080,
            senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            fee: Utils.BigNumber.make("10000000"),
            amount: Utils.BigNumber.make("1200000000"),
            expiration: 0,
            recipientId: "DBYyh2vXcigrJGUHfvmYxVxEqeH7vomw6x",
            signature:
                "30440220464beac6d49943ad8afaac4fdc863c9cd7cf3a84f9938c1d7269ed522298f11a02203581bf180de1966f86d914afeb005e1e818c9213514f96a34e1391c2a08514fa",
            id: "947fe8745eeed8fa6e5ad62a8dad29bcf3d50ce001907926c486460d1cc1f1c0",
            blockId: "17605317082329008056",
            sequence: 4,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 62222080,
            senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            fee: Utils.BigNumber.make("10000000"),
            amount: Utils.BigNumber.make("1800000000"),
            expiration: 0,
            recipientId: "DBYyh2vXcigrJGUHfvmYxVxEqeH7vomw6x",
            signature:
                "3045022100c7b40d7134d909762d18d6bfb7ac1c32be0ee8c047020131f499faea70ca0b2b0220117c0cf026f571f5a85e3ae800a6fd595185076ff38e64c7a4bd14f34e1d4dd1",
            id: "98387933d65fabffe2642464d4c7b1ff5fe1fa5a35992f834b0ac145dff462ea",
            blockId: "17605317082329008056",
            sequence: 5,
        },
        {
            version: 1,
            network: 30,
            type: 0,
            timestamp: 62222080,
            senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            fee: Utils.BigNumber.make("10000000"),
            amount: Utils.BigNumber.make("1400000000"),
            expiration: 0,
            recipientId: "DBYyh2vXcigrJGUHfvmYxVxEqeH7vomw6x",
            signature:
                "304402206a4a8e4e6918fbc15728653b117f51db716aeb04e5ee1de047f80b0476ee4efb02200f486dfaf0def3f3e8636d46ee75a2c07de9714ce4283a25fde9b6218b5e7923",
            id: "e93345dd9a87ac4e84d9bfd892dfbfeb02e546e5bd7822168d0f72c7662e6176",
            blockId: "17605317082329008056",
            sequence: 6,
        },
    ],
};

export const dummyBlockSize = 1291;

export const dummyBlock2 = {
    data: dummyBlock,
    serialized:
        "00000000006fb50300db1a002b324b8b33a85802070000000049d97102000000801d2c040000000000c2eb0b00000000e0000000de56269cae3ab156f6979b94a04c30b82ed7d6f9a97d162583c98215c18c65db03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac3730450221008c59bd2379061ad3539b73284fc0bbb57dbc97efd54f55010ba3f198c04dde7402202e482126b3084c6313c1378d686df92a3e2ef5581323de11e74fe07eeab339f3",
    serializedFull:
        "00000000006fb50300db1a002b324b8b33a85802070000000049d97102000000801d2c040000000000c2eb0b00000000e0000000de56269cae3ab156f6979b94a04c30b82ed7d6f9a97d162583c98215c18c65db03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac3730450221008c59bd2379061ad3539b73284fc0bbb57dbc97efd54f55010ba3f198c04dde7402202e482126b3084c6313c1378d686df92a3e2ef5581323de11e74fe07eeab339f3990000009a0000009a0000009a000000990000009a00000099000000ff011e00006fb50303287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37809698000000000000006d7c4d00000000000000001e46550551e12d2531ea9d2968696b75f68ae7f29530440220714c2627f0e9c3bd6bf13b8b4faa5ec2d677694c27f580e2f9e3875bde9bc36f02201c33faacab9eafd799d9ceecaa153e3b87b4cd04535195261fd366e552652549ff011e00006fb50303287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac3780969800000000000000f1536500000000000000001e46550551e12d2531ea9d2968696b75f68ae7f2953045022100e6039f810684515c0d6b31039040a76c98f3624b6454cb156a0a2137e5f8dba7022001ada19bcca5798e1c7cc8cc39bab5d4019525e3d72a42bd2c4129352b8ead87ff011e00006fb50303287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37809698000000000000002f685900000000000000001e46550551e12d2531ea9d2968696b75f68ae7f2953045022100c2b5ef772b36e468e95ec2e457bfaba7bad0e13b3faf57e229ff5d67a0e017c902202339664595ea5c70ce20e4dd182532f7fa385d86575b0476ff3eda9f9785e1e9ff011e00006fb50303287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac3780969800000000000000105e5f00000000000000001e46550551e12d2531ea9d2968696b75f68ae7f29530450221009ceb56688705e6b12000bde726ca123d84982231d7434f059612ff5f987409c602200d908667877c902e7ba35024951046b883e0bce9103d4717928d94ecc958884aff011e00006fb50303287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37809698000000000000008c864700000000000000001e46550551e12d2531ea9d2968696b75f68ae7f29530440220464beac6d49943ad8afaac4fdc863c9cd7cf3a84f9938c1d7269ed522298f11a02203581bf180de1966f86d914afeb005e1e818c9213514f96a34e1391c2a08514faff011e00006fb50303287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac3780969800000000000000d2496b00000000000000001e46550551e12d2531ea9d2968696b75f68ae7f2953045022100c7b40d7134d909762d18d6bfb7ac1c32be0ee8c047020131f499faea70ca0b2b0220117c0cf026f571f5a85e3ae800a6fd595185076ff38e64c7a4bd14f34e1d4dd1ff011e00006fb50303287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37809698000000000000004e725300000000000000001e46550551e12d2531ea9d2968696b75f68ae7f295304402206a4a8e4e6918fbc15728653b117f51db716aeb04e5ee1de047f80b0476ee4efb02200f486dfaf0def3f3e8636d46ee75a2c07de9714ce4283a25fde9b6218b5e7923",
};

export const dummyBlock3 = {
    id: "7242383292164246617",
    version: 0,
    timestamp: 46583338,
    height: 3,
    reward: Utils.BigNumber.make("0"),
    previousBlock: "17882607875259085966",
    numberOfTransactions: 0,
    totalAmount: Utils.BigNumber.make("0"),
    totalFee: Utils.BigNumber.make("0"),
    payloadLength: 0,
    payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    generatorPublicKey: "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17",
    blockSignature:
        "304402204087bb1d2c82b9178b02b9b3f285de260cdf0778643064fe6c7aef27321d49520220594c57009c1fca543350126d277c6adeb674c00685a464c3e4bf0d634dc37e39",
    createdAt: "2018-09-11T16:48:58.431Z",
};

export const blockWithExceptions = {
    id: "15986760691378510176",
    version: 0,
    timestamp: 52310186,
    height: 766787,
    reward: "200000000",
    transactions: [
        {
            "version": 1,
            "network": 30,
            "type": 0,
            "timestamp": 52308692,
            "senderPublicKey": "039c09c66328ebe7569cd49aa441e45c9df96c1d644c7acf33f7bc763709c41c1f",
            "fee": "10000000",
            "amount": "0",
            "expiration": 0,
            "recipientId": "D5KU9KrMYXdkEsRbv4y8hvetGbsJwf9z3P",
            "signature": "304402200ca79a6ebcd29cbf6bea42fa6890e0c7bfd82fd5e7cd327913f966b433b24086022051f127b1349af1ccb49cdc27595844d5228d612ef8c7d57d63dc5b75620c7e64",
            "vendorField": "True Pasta Weight.",
            "id": "3945e67bb5e864d2dd206293f1e778fa2181db5f81c2efc0a89e8fe53e2a2e7c"
        },
        {
            "version": 1,
            "network": 30,
            "type": 0,
            "timestamp": 52308443,
            "senderPublicKey": "02364aaaf17c35f74e397433f988361aee408c5b5314eaad5b815c4f4f7c578b1e",
            "fee": "10000000",
            "amount": "250000000",
            "expiration": 0,
            "recipientId": "DJA2sqCbnmR63sD8doGrXrK3fCiqcA4GUw",
            "signature": "3045022100f3a61a0460abe78a4705904216ac17a7bf50b19d70717624c15b64a94207cbeb022070a7bf3d97a3e690839ce1764413ce890ea233eb7eba202d373a376fc4b551b6",
            "vendorField": "True Pasta Weight.",
            "id": "8e4853ed764bb1853e58fda4a9c507f73b820dd738e4a9b197dafb37a22b6b0f"
        }
    ],
    previousBlock: "17296711371070322453",
    numberOfTransactions: 2,
    totalAmount: "250000000",
    totalFee: "20000000",
    payloadLength: 64,
    payloadHash: "53033d24a4f133e47fee3871d82bca12bdf8b58ec4ebf43ac2b7849e78278256",
    generatorPublicKey: "02d0244d939fad9004cc104f71b46b428d903e4f2988a65f39fdaa1b7482894c9e",
    blockSignature:
        "30440220053747c5d02b38c9f8980d771918a5c48c99080a0bba661d3609553ed14c3f0d022063da2ba62e002d91b0f3bdba4e0c822bf0f5ce88b95867192252a2418ec0556f",
    previousBlockHex: "f00a43599f1b3715",
};
