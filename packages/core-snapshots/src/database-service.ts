import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Identifiers } from "./ioc";
import { SnapshotBlockRepository, SnapshotRoundRepository, SnapshotTransactionRepository } from "./repositories";
import { Models } from "@arkecosystem/core-database";
import { Connection } from "typeorm";
import { Blocks, Interfaces } from "@arkecosystem/crypto";

@Container.injectable()
export class SnapshotDatabaseService implements Contracts.Snapshot.DatabaseService {
    @Container.inject(Container.Identifiers.DatabaseConnection)
    private readonly connection!: Connection;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Identifiers.SnapshotBlockRepository)
    private readonly snapshotBlockRepository!: SnapshotBlockRepository;

    @Container.inject(Identifiers.SnapshotRoundRepository)
    private readonly snapshotRoundRepository!: SnapshotRoundRepository;

    @Container.inject(Identifiers.SnapshotTransactionRepository)
    private readonly snapshotTransactionRepository!: SnapshotTransactionRepository;

    public async truncate(): Promise<void> {
        this.logger.info("Running TRUNCATE method inside DatabaseService");

        this.logger.info(`Is database connected: ${this.connection.isConnected}`);

        this.logger.info(
            `Clearing:  ${await this.snapshotBlockRepository.count()} blocks,  ${await this.snapshotTransactionRepository.count()} transactions,  ${await this.snapshotRoundRepository.count()} rounds.`,
        );

        await this.snapshotTransactionRepository.clear();
        await this.snapshotRoundRepository.clear();
        await this.snapshotBlockRepository.delete({}); // Clear does't work on tables with relations
    }

    public async rollbackChain(roundInfo: Contracts.Shared.RoundInfo): Promise<Interfaces.IBlock> {
        const lastRemainingBlock = await this.getLastBlock();

        Utils.assert.defined<Models.Block>(lastRemainingBlock);

        this.logger.info(`Last block height is: ${lastRemainingBlock.height}`);


        await this.snapshotBlockRepository.rollbackChain(roundInfo);
        // try {
        //     await this.snapshotBlockRepository.rollbackChain(lastRemainingBlock);
        // } catch (error) {
        //     // logger.error(error);
        // }

        return this.getLastBlock();
    }

    public async getLastBlock(): Promise<Interfaces.IBlock> {
        let block: Interfaces.IBlockData | undefined = await this.snapshotBlockRepository.findLast();

        if (!block) {
            throw new Error("Cannot find last block")
        }

        const lastBlock: Interfaces.IBlock = Blocks.BlockFactory.fromData(block)!;

        return lastBlock;
    }

    public async test(): Promise<void> {
        // return this.snapshotBlockRepository.test();

        console.log("Last block:", await this.getLastBlock())
    }
}
