import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { Block } from "./models/block";

@Container.injectable()
export class BlockModelConverter implements Contracts.Database.BlockModelConverter {
    public getBlockModels(blocks: Interfaces.IBlock[]): Contracts.Database.BlockModel[] {
        return blocks.map((b) => Object.assign(new Block(), b.data));
    }

    public getBlockData(models: Contracts.Database.BlockModel[]): Interfaces.IBlockData[] {
        return models;
    }
}
