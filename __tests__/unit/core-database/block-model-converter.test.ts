import { Container } from "@arkecosystem/core-kernel";
import { Blocks } from "@arkecosystem/crypto";

import { BlockModelConverter } from "../../../packages/core-database/src/block-model-converter";
import block1760000 from "./__fixtures__/block1760000";

const container = new Container.Container();

describe("BlockModelConverter", () => {
    it("should convert block to model and back to data", () => {
        const blockModelConverter = container.resolve(BlockModelConverter);
        const block = Blocks.BlockFactory.fromData(block1760000);
        const model = blockModelConverter.getBlockModel(block);
        const data = blockModelConverter.getBlockData(model);

        expect(data).toEqual(block.data);
    });
});
