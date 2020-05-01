import { Models, Repositories } from "@arkecosystem/core-database";
import { Contracts } from "@packages/core-kernel";
import { EntityRepository } from "typeorm";

import { Repository } from "../contracts";

@EntityRepository(Models.Block)
export class BlockRepository extends Repositories.AbstractEntityRepository<Models.Block> implements Repository {
    public async getReadStream(start: number, end: number): Promise<NodeJS.ReadableStream> {
        return this.createQueryBuilder()
            .where("height >= :start AND height < :end", { start, end })
            .orderBy("height", "ASC")
            .stream();
    }

    public async countInRange(start: number, end: number): Promise<number> {
        return this.createQueryBuilder().where("height >= :start AND height < :end", { start, end }).getCount();
    }

    public async rollback(roundInfo: Contracts.Shared.RoundInfo): Promise<void> {
        const block = await this.findByHeight(roundInfo.roundHeight);

        if (!block) {
            throw new Error("Cannot find block on height " + roundInfo.roundHeight);
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
        const topBlocks = await this.find({
            take: 1,
            order: {
                height: "DESC",
            },
        });

        return topBlocks[0];
    }

    public async findFirst(): Promise<Models.Block | undefined> {
        const topBlocks = await this.find({
            take: 1,
            order: {
                height: "ASC",
            },
        });

        return topBlocks[0];
    }

    public async findByHeight(height: number): Promise<Models.Block | undefined> {
        return this.findOne({
            height: height,
        });
    }
}
