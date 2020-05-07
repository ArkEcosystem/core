import { Interfaces } from "@arkecosystem/core-crypto";

export interface BlockState {
    applyBlock(block: Interfaces.IBlock): Promise<void>;

    revertBlock(block: Interfaces.IBlock): Promise<void>;
}
