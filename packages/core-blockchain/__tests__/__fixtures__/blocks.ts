import { Utils } from "@packages/crypto";

export const block1 = {
    data: {
        id: "17184958558311101492",
        version: 0,
        timestamp: 0,
        height: 1,
    },
    transactions: [],
};

export const block2 = {
    data: {
        id: "17882607875259085966",
        version: 0,
        timestamp: 46583330,
        height: 2,
        reward: Utils.BigNumber.make("0"),
        previousBlock: "17184958558311101492",
        numberOfTransactions: 0,
        totalAmount: Utils.BigNumber.make("0"),
        totalFee: Utils.BigNumber.make("0"),
        payloadLength: 0,
        payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        generatorPublicKey: "026c598170201caf0357f202ff14f365a3b09322071e347873869f58d776bfc565",
        blockSignature:
            "3045022100e7385c6ea42bd950f7f6ab8c8619cf2f66a41d8f8f185b0bc99af032cb25f30d02200b6210176a6cedfdcbe483167fd91c21d740e0e4011d24d679c601fdd46b0de9",
        // createdAt: "2018-09-11T16:48:50.550Z",
    },
    transactions: [],
};
export const block3 = {
    data: {
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
    },
    transactions: [],
};
