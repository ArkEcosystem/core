import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { Block } from "./models/block";

@Container.injectable()
export class BlockModelConverter implements Contracts.Database.BlockModelConverter {
    public getBlockModel(block: Interfaces.IBlock): Contracts.Database.BlockModel {
        return Object.assign(new Block(), block.data);
    }

    public getBlockData(model: Contracts.Database.BlockModel): Interfaces.IBlockData {
        return model;
    }
}
