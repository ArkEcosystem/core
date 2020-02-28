import { Contracts, Utils } from "@arkecosystem/core-kernel";
import { EntityRepository, Repository } from "typeorm";

import { Round } from "../models";

@EntityRepository(Round)
export class RoundRepository extends Repository<Round> {
    public async findById(id: string): Promise<Round[]> {
        return this.find({
            where: {
                id,
            },
        });
    }

    public async save(delegates: readonly Contracts.State.Wallet[]): Promise<never> {
        const round: { publicKey: string; balance: Utils.BigNumber; round: number }[] = delegates.map(
            (delegate: Contracts.State.Wallet) => ({
                publicKey: delegate.publicKey!,
                balance: delegate.getAttribute("delegate.voteBalance"),
                round: delegate.getAttribute("delegate.round"),
            }),
        );

        return super.save(round) as never;
    }
}
