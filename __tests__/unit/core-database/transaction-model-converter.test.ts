import { Container } from "@arkecosystem/core-kernel";
import { CryptoSuite } from "@packages/core-crypto";

import { TransactionModelConverter } from "../../../packages/core-database/src/transaction-model-converter";
import { makeMockBlock } from "./__fixtures__/block1760000";

const container = new Container.Container();
const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));

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

describe("TransactionModelConverter", () => {
    it("should convert transaction to model and back to data", () => {
        const transactionModelConverter = container.resolve(TransactionModelConverter);
        const transaction = crypto.BlockFactory.fromData(makeMockBlock(crypto.CryptoManager), getTimeStampForBlock)
            .transactions[0];
        const model = transactionModelConverter.getTransactionModel(transaction);
        model.nonce = crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1"); // set_row_nonce trigger
        const data = transactionModelConverter.getTransactionData(model);

        expect(data).toEqual(
            Object.assign({}, transaction.data, {
                nonce: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("1"),
            }),
        );
    });
});
