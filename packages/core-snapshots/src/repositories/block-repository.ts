import { Models } from "@arkecosystem/core-database";
import { Contracts } from "@arkecosystem/core-kernel";
import { Readable } from "stream";
import { EntityRepository } from "typeorm";

import { AbstractRepository } from "./abstract-repository";

@EntityRepository(Models.Block)
export class BlockRepository extends AbstractRepository<Models.Block> {
    public async getReadStream(start: number, end: number): Promise<Readable> {
        return this.createQueryBuilder()
            .where("height >= :start AND height <= :end", { start, end })
            .orderBy("height", "ASC")
            .stream();
    }

    public async truncate(): Promise<void> {
        await this.manager.query("TRUNCATE TABLE transactions, rounds, blocks");
    }

    public async countInRange(start: number, end: number): Promise<number> {
        return this.fastCount({ where: "height >= :start AND height <= :end", parameters: { start, end } });
    }

    public async rollback(roundInfo: Contracts.Shared.RoundInfo): Promise<void> {
        const block = await this.findByHeight(roundInfo.roundHeight - 1);

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
                .where("round > :round", { round: roundInfo.round - 1 })
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
