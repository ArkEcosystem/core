import { Utils } from "@arkecosystem/crypto";

export const transaction = {
    version: 1,
    id: "943c220691e711c39c79d437ce185748a0018940e1a4144293af9d05627d2eb4",
    blockid: "11233167632577333611",
    type: 0,
    timestamp: 36482198,
    amount: Utils.BigNumber.make(100000000),
    fee: Utils.BigNumber.make(10000000),
    senderId: "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh",
    recipientId: "DTRdbaUW3RQQSL5By4G43JVaeHiqfVp9oh",
    senderPublicKey: "034da006f958beba78ec54443df4a3f52237253f7ae8cbdb17dccf3feaa57f3126",
    signature:
        "304402205881204c6e515965098099b0e20a7bf104cd1bad6cfe8efd1641729fcbfdbf1502203cfa3bd9efb2ad250e2709aaf719ac0db04cb85d27a96bc8149aeaab224de82b",
    asset: {},
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
