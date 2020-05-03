import { Container } from "@arkecosystem/core-kernel";
import { Blocks, Utils } from "@arkecosystem/crypto";

import { TransactionModelConverter } from "../../../packages/core-database/src/transaction-model-converter";
import block1760000 from "./__fixtures__/block1760000";

const container = new Container.Container();

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
        const transaction = Blocks.BlockFactory.fromData(block1760000, getTimeStampForBlock).transactions[0];
        const model = transactionModelConverter.getTransactionModel(transaction);
        model.nonce = Utils.BigNumber.make("1"); // set_row_nonce trigger
        const data = transactionModelConverter.getTransactionData(model);

        expect(data).toEqual(Object.assign({}, transaction.data, { nonce: Utils.BigNumber.make("1") }));
    });
});
