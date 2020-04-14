import { EntityRepository } from "typeorm";

import { Repositories, Models } from "@arkecosystem/core-database";
import { Contracts } from "@packages/core-kernel";

@EntityRepository(Models.Block)
export class SnapshotBlockRepository extends Repositories.AbstractEntityRepository<Models.Block> {
    public async rollbackChain(roundInfo: Contracts.Shared.RoundInfo): Promise<void> {
        const block = await this.findByHeight(roundInfo.roundHeight);

        console.log("Block height to delete: " +  block?.height);

        if (!block) {
            throw new Error("Missing block by height.");
        }

        return this.manager.transaction(async (manager) => {
            await manager
                .createQueryBuilder()
                .delete()
                .from(Models.Transaction)
                .where("timestamp > :timestamp", { timestamp: block.timestamp })
                .execute();

            await manager
                .createQueryBuilder()
                .delete()
                .from(Models.Block)
                .where("height > :height", { height: block.height })
                .execute();

            await manager
                .createQueryBuilder()
                .delete()
                .from(Models.Round)
                .where("round > :round", { round: roundInfo.round })
                .execute();
        });
    }

    public async findLast(): Promise<Models.Block | undefined> {
        let topBlocks = await this.find({
            take: 1,
            order: {
                height: "DESC"
            }
        });

        return topBlocks[0];
    }

    public async findFirst(): Promise<Models.Block | undefined> {
        let topBlocks = await this.find({
            take: 1,
            order: {
                height: "ASC"
            }
        });

        return topBlocks[0];
    }


    public async findByHeight(height: number): Promise<Models.Block | undefined> {
        return this.findOne({
            height: height
        });
    }

    public async test(): Promise<void> {
        return this.manager.transaction(async (manager) => {
            // let deleteTransactions =  manager
            //     .createQueryBuilder()
            //     .delete()
            //     .from(Models.Transaction)
            //     .where({timestamp: MoreThan(0)});
            //
            // console.log(deleteTransactions.getSql());
            //
            // let deleteBlocks = manager
            //     .createQueryBuilder()
            //     .delete()
            //     .from(Models.Block)
            //     .where({height: MoreThan(10)});
            //
            // console.log(deleteBlocks.getSql());
            //
            // let deleteBlocks2 = manager
            //     .createQueryBuilder()
            //     .delete()
            //     .from(Models.Block)
            //     .where({totalAmount: MoreThan(10)});
            //
            // console.log(deleteBlocks2.getSql());

            let deleteRounds =  manager
                .createQueryBuilder()
                .delete()
                .from(Models.Round)
                .where("round > :round", { round: 0 });

            console.log(deleteRounds.getSql());

            await deleteRounds.execute();
        });
    }
}
