import { Container } from "@arkecosystem/core-kernel";
import { Blocks, Utils } from "@arkecosystem/crypto";

import { ModelConverter } from "../../../packages/core-database/src/model-converter";
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

describe("ModelConverter.getTransactionData", () => {
    it("should convert transaction to model and back to data", () => {
        const modelConverter = container.resolve(ModelConverter);
        const transaction = Blocks.BlockFactory.fromData(block1760000, getTimeStampForBlock).transactions[0];
        const models = modelConverter.getTransactionModels([transaction]);
        models[0].nonce = Utils.BigNumber.make("1"); // set_row_nonce trigger
        const data = modelConverter.getTransactionData(models);

        expect(data).toEqual([Object.assign({}, transaction.data, { nonce: Utils.BigNumber.make("1") })]);
    });
});

describe("ModelConverter.getBlockData", () => {
    it("should convert block to model and back to data", () => {
        const modelConverter = container.resolve(ModelConverter);
        const block = Blocks.BlockFactory.fromData(block1760000, getTimeStampForBlock);
        const models = modelConverter.getBlockModels([block]);
        const data = modelConverter.getBlockData(models);

        expect(data).toEqual([block.data]);
    });
});
