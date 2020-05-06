export const constructTransaction = (bigNumberConstructor) => {
    return {
        version: 1,
        id: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
        blockid: "11233167632577333611",
        type: 0,
        timestamp: 36482198,
        amount: bigNumberConstructor.make(100000000),
        fee: bigNumberConstructor.make(10000000),
        senderId: "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh",
        recipientId: "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh",
        senderPublicKey: "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
        signature:
            "304402205881204c6e515965098099b0e20a7bf104cd1bad6cfe8efd1641729fcbfdbf1502203cfa3bd9efb2ad250e2709aaf719ac0db04cb85d27a96bc8149aeaab224de82b",
        asset: {},
    };
};

// passphrases: "secret 1", "secret 2", "secret 3"
export const legacyMultiSignatureRegistration = {
    data: {
        id: "cfc579b43761eb10cdccd5be43a259f59d5faac72cb67e009e10c4d67ba86694",
        version: 1,
        timestamp: 65254772,
        senderPublicKey: "039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
        type: 4,
        amount: "0",
        fee: "2000000000",
        signature:
            "3045022100813603cf196286039206f444cb0508290f71f4a9e81f85913e6d302183fb00ba0220448d6b9bd60aa1dbe209b8313ae1b2e4ab3157b8de6796920cacb1bd3e1b1166",
        asset: {
            multiSignatureLegacy: {
                keysgroup: [
                    "+039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22",
                    "+028d3611c4f32feca3e6713992ae9387e18a0e01954046511878fe078703324dc0",
                    "+021d3932ab673230486d0f956d05b9e88791ee298d9af2d6df7d9ed5bb861c92dd",
                ],
                min: 3,
                lifetime: 0,
            },
        },
    },
    serialized:
        "ff011e0474b5e303039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22009435770000000000030300039180ea4a8a803ee11ecb462bb8f9613fcdb5fe917e292dbcc73409f0e98f8f22028d3611c4f32feca3e6713992ae9387e18a0e01954046511878fe078703324dc0021d3932ab673230486d0f956d05b9e88791ee298d9af2d6df7d9ed5bb861c92dd3045022100813603cf196286039206f444cb0508290f71f4a9e81f85913e6d302183fb00ba0220448d6b9bd60aa1dbe209b8313ae1b2e4ab3157b8de6796920cacb1bd3e1b1166",
};

export const buildDevnetTxs = (bigNumberConstructor) => [
    {
        id: "89f354918b36197269b0e5514f8da66f19829a024f664ccc124bfaabe0266e10",
        version: 1,
        timestamp: 48068690,
        senderPublicKey: "03b7d1da5c1b9f8efd0737d47123eb9cf7eb6d58198ef31bb6f01aa04bc4dda19d",
        recipientId: "DHPNjqCaTR9KYtC8nHh7Zt1G86Xj4YiU2V",
        type: 1,
        amount: bigNumberConstructor.make("0"),
        fee: bigNumberConstructor.make("500000000"),
        signature:
            "3045022100e8e03bdac70e18f220feacba25c1575aa89d1ab61673e54eb2aff38439666d2702207e2d84290d7ef2571f5b2fab7e22a77dec96b1c4187cf9def15be74db98e2700",
        asset: {
            signature: {
                publicKey: "03b7d1da5c1b9f8efd0737d47123eb9cf7eb6d58198ef31bb6f01aa04bc4dda19d",
            },
        },
    },
    {
        id: "a50af2bb1f043d128480346d0b49f5b3165716d5c630c6b0978dc7aa168e77a8",
        version: 1,
        timestamp: 48068923,
        senderPublicKey: "03173fd793c4bac0d64e9bd74ec5c2055716a7c0266feec9d6d94cb75be097b75d",
        recipientId: "DQrj9eh9otRgz2jWdu1K1ASBQqZA6dTkra",
        type: 1,
        amount: bigNumberConstructor.make("0"),
        fee: bigNumberConstructor.make("500000000"),
        signature:
            "3045022100b263d28a5da58b17c874a5666afab0657f8492266554ad8ff722b00d41e1493d02200c2156dd9b9c1739f1c2099e98b763952bc7ef0423ad9786dcd32f7ffaf4aafc",
        asset: {
            signature: {
                publicKey: "03173fd793c4bac0d64e9bd74ec5c2055716a7c0266feec9d6d94cb75be097b75d",
            },
        },
    },
    {
        id: "68e34dc1c417cbfb47e5deea142974bc24c8d03df206f168c8b23d6a4decff73",
        version: 1,
        timestamp: 48068956,
        senderPublicKey: "02813ade967f05384e0567841d175294b4102c06c428011646e5ef989212925fcf",
        recipientId: "D8PGSYLUC3CxYaXoKjMA2gjV4RaeBpwghZ",
        type: 1,
        amount: bigNumberConstructor.make("0"),
        fee: bigNumberConstructor.make("500000000"),
        signature:
            "3045022100e593eb501e89941461e247606d088b6e226cc5b5224f89cede532d35f9b16250022034bbdd098493639221e808301e0a99c3790ef9c6d357ac10266c518a2a66066f",
        asset: {
            signature: {
                publicKey: "02813ade967f05384e0567841d175294b4102c06c428011646e5ef989212925fcf",
            },
        },
    },
    {
        id: "b4b3433be888b4b95b68b83a84a08e40d748b0ad92acf8487072ef01c1de251a",
        version: 1,
        timestamp: 48069792,
        senderPublicKey: "03f9f9dafc06faf4a54be2e45cd7a5523e41f38bb439f6f93cf00a0990e7afc116",
        recipientId: "DNuwcwYGTHDdhTPWMTYekhuGM1fFUpW9Jj",
        type: 1,
        amount: bigNumberConstructor.make("0"),
        fee: bigNumberConstructor.make("500000000"),
        signature:
            "3044022052d1e5be426a79f827a67597fd460237de65e035593144e4e3afb0e82ab40f3802201d6e31892d000e73532bf8659851a3d221205d65ed1c0b8d08ce46b72c7f00ae",
        asset: {
            signature: {
                publicKey: "03f9f9dafc06faf4a54be2e45cd7a5523e41f38bb439f6f93cf00a0990e7afc116",
            },
        },
    },
];

export const buildMainnetTxs = (bigNumberConstructor) => [
    {
        id: "80d75c7b90288246199e4a97ba726bad6639595ef92ad7c2bd14fd31563241ab",
        height: 918991,
        type: 1,
        timestamp: 7410965,
        amount: bigNumberConstructor.make(0),
        fee: bigNumberConstructor.make(500000000),
        recipientId: "AP4UQ6j9hAHsxudpXh47RNQi7oF1AEfkAG",
        senderPublicKey: "03ca269b2942104b2ad601ccfbe7bd30b14b99cb55210ef7c1a5e25b6669646b99",
        signature:
            "3045022100d01e0cf0813a722ab5ad92aece2d4d1c3a537422e2ea769182f9172417224e890220437e407db51c4c47393db2e5b1258b2e3ecb707738a5ffdc6e96f08aee7e9c74",
        asset: {
            signature: {
                publicKey: "03c0e7e86dadd316275a31d84a1fdccd00cd26cc059982f95a1b24382c6ec2ceb0",
            },
        },
    },
];
