import { Container } from "@arkecosystem/core-kernel";
import { CryptoSuite } from "@packages/core-crypto";

import { BlockModelConverter } from "../../../packages/core-database/src/block-model-converter";
import { makeMockBlock } from "./__fixtures__/block1760000";

const container = new Container.Container();
const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));

container.bind(Container.Identifiers.CryptoManager).toConstantValue(crypto.CryptoManager);
container.bind(Container.Identifiers.TransactionManager).toConstantValue(crypto.TransactionManager);
container.bind(Container.Identifiers.BlockFactory).toConstantValue(crypto.BlockFactory);

const getTimeStampForBlock = (height: number) => {
    switch (height) {
        case 1:
            return 0;
        default:
            throw new Error(`Test scenarios should not hit this line`);
    }
};

describe("BlockModelConverter", () => {
    it("should convert block to model and back to data", () => {
        const blockModelConverter = container.resolve(BlockModelConverter);
        const block = crypto.BlockFactory.fromData(makeMockBlock(crypto.CryptoManager), getTimeStampForBlock);
        const model = blockModelConverter.getBlockModel(block);
        const data = blockModelConverter.getBlockData(model);

        expect(data).toEqual(block.data);
    });
});
