import { Container } from "@arkecosystem/core-kernel";
import { CryptoSuite } from "@packages/core-crypto";

import { ModelConverter } from "../../../packages/core-database/src/model-converter";
import { makeMockBlock } from "./__fixtures__/block1760000";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));

const container = new Container.Container();

container.bind(Container.Identifiers.CryptoManager).toConstantValue(crypto.CryptoManager);
container.bind(Container.Identifiers.TransactionManager).toConstantValue(crypto.TransactionManager);
container.bind(Container.Identifiers.BlockFactory).toConstantValue(crypto.BlockFactory);

const getTimeStampForBlock = (height: number): number => {
    switch (height) {
        case 1:
            return 0;
        default:
            throw new Error(`Test scenarios should not hit this line`);
    }
};

describe("ModelConverter.getTransactionData", () => {
    it("should convert transaction to model and back to data", () => {
        const modelConverter = container.resolve(ModelConverter);
        const transaction = crypto.BlockFactory.fromData(makeMockBlock(crypto.CryptoManager), getTimeStampForBlock)
            .transactions[0];
        const models = modelConverter.getTransactionModels([transaction]);
        models[0].nonce = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1"); // set_row_nonce trigger
        const data = modelConverter.getTransactionData(models);

        expect(data).toEqual([
            Object.assign({}, transaction.data, {
                nonce: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1"),
            }),
        ]);
    });
});

describe("ModelConverter.getBlockData", () => {
    it("should convert block to model and back to data", () => {
        const modelConverter = container.resolve(ModelConverter);
        const block = crypto.BlockFactory.fromData(makeMockBlock(crypto.CryptoManager), getTimeStampForBlock);
        const models = modelConverter.getBlockModels([block]);
        const data = modelConverter.getBlockData(models);

        expect(data).toEqual([block.data]);
    });
});
