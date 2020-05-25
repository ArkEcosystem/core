import { Interfaces } from "@arkecosystem/crypto";

import { BlockModel } from "./models";

export interface BlockModelConverter {
    getBlockModels(blocks: Interfaces.IBlock[]): BlockModel[];
    getBlockData(models: BlockModel[]): Interfaces.IBlockData[];
}
