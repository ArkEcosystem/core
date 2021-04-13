import { Contracts, Utils } from "@arkecosystem/core-kernel";
import { EntityRepository, Repository } from "typeorm";

import { Round } from "../models";

@EntityRepository(Round)
export class RoundRepository extends Repository<Round> {
    public async findById(id: string): Promise<Round[]> {
        return this.find({
            where: {
                round: id,
            },
        });
    }

    public async getRound(round: number): Promise<Round[]> {
        return this.createQueryBuilder()
            .select()
            .where("round = :round", { round })
            .orderBy("balance", "DESC")
            .addOrderBy("public_key", "ASC")
            .getMany();
    }

    public async save(delegates: readonly Contracts.State.Wallet[]): Promise<never> {
        const round: { publicKey: string; balance: Utils.BigNumber; round: number }[] = delegates.map(
            (delegate: Contracts.State.Wallet) => ({
                publicKey: delegate.getPublicKey()!,
                balance: delegate.getAttribute("delegate.voteBalance"),
                round: delegate.getAttribute("delegate.round"),
            }),
        );

        return super.save(round) as never;
    }

    public async deleteFrom(round: number): Promise<void> {
        await this.createQueryBuilder().delete().where("round >= :round", { round }).execute();
    }
}
