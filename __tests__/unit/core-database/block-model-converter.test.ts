import { Container } from "@arkecosystem/core-kernel";
import { Blocks } from "@arkecosystem/crypto";

import { BlockModelConverter } from "../../../packages/core-database/src/block-model-converter";
import block1760000 from "./__fixtures__/block1760000";

const container = new Container.Container();

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
        const block = Blocks.BlockFactory.fromData(block1760000, getTimeStampForBlock);
        const model = blockModelConverter.getBlockModel(block);
        const data = blockModelConverter.getBlockData(model);

        expect(data).toEqual(block.data);
    });
});
