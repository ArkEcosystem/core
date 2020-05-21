import { Interfaces } from "@arkecosystem/core-crypto";

import { BlockModel } from "./models";

export interface BlockModelConverter {
    getBlockModel(block: Interfaces.IBlock): BlockModel;
    getBlockData(model: BlockModel): Interfaces.IBlockData;
}
