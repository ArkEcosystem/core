import { Blocks, Utils } from "@arkecosystem/crypto";

export const sampleBlocks = [
    Blocks.BlockFactory.fromData({
        id: "7686497416922799951",
        version: 0,
        timestamp: 62225384,
        height: 1760011,
        previousBlock: "1111111111111111111",
        numberOfTransactions: 0,
        totalAmount: Utils.BigNumber.make(0),
        totalFee: Utils.BigNumber.make(0),
        reward: Utils.BigNumber.make(200000000),
        payloadLength: 0,
        payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        generatorPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        blockSignature:
            // tslint:disable-next-line:max-line-length
            "304402205b5da8a3cfb28398baaa50e299d735226c4455bdfdf5cb650afb53b0f22a93c60220572c4a4652edcd1bb85720884a7b0732add4dd50e7a0984325807770c99939bd",
    }),
    Blocks.BlockFactory.fromData({
        id: "341e8008227a887b2f658f9071118ebe73720b7b8f58d2ae3d24ae933888f6d7",
        version: 0,
        timestamp: 62376432,
        height: 1000000001,
        previousBlock: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        numberOfTransactions: 0,
        totalAmount: Utils.BigNumber.make(0),
        totalFee: Utils.BigNumber.make(0),
        reward: Utils.BigNumber.make(200000000),
        payloadLength: 0,
        payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        generatorPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
        blockSignature:
            // tslint:disable-next-line:max-line-length
            "3045022100afa57d28e227720b166d46c443e7a6c810c2442f4a00f4405258fd73d3806b7b02206f65bc93679f753d840fb5b168b04512aed9bb039f98178ce6b6237b65a8d9cf",
    }),
];
