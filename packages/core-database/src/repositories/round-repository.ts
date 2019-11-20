import { Contracts } from "@arkecosystem/core-kernel";
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

    public async save(delegateWallets: Contracts.State.Wallet[]): Promise<never> {
        return (super.save(
            delegateWallets.map(delegate => ({
                publicKey: delegate.publicKey,
                balance: delegate.getAttribute("delegate.voteBalance"),
                round: delegate.getAttribute("delegate.round"),
            })),
        ) as unknown) as never;
    }
}
