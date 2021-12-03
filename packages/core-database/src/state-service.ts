import { Interfaces } from "@packages/crypto";
import { Connection } from "typeorm";

import { BlockRepository } from "./repositories";

export class StateService {
    @Container.inject(Container.Identifiers.DatabaseConnection)
    private readonly connection!: Connection;

    public async getLastState(): Promise<Interfaces.IState> {
        this.connection.transaction("REPEATABLE READ", async (manager) => {
            const blockRepository = manager.getRepository<BlockRepository>();
            blockRepository.getLastBlock();
            blockRepository.getLastFinalizedBlocks();
            blockRepository.getLastFinalizedBlocks();
        });
    }

    public async saveState(state: Interfaces.IState): Promise<void> {
        this.connection.transaction("READ UNCOMMITTED", async (manager) => {
            const blockRepository = manager.getRepository<BlockRepository>();

            blockRepository.saveBlock(state.block);
            blockRepository.updateFinalized(state.finalizedBlock.id, true);
            blockRepository.updateJustified(state.justifiedBlock.id, true);
        });
        //
    }

    public async truncateToHeight(height: number): Promise<void> {}
}
