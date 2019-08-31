import { Contracts } from "@arkecosystem/core-kernel";

import { Round } from "../models";
import { queries } from "../queries";
import { Repository } from "./repository";

export class RoundsRepository extends Repository implements Contracts.Database.RoundsRepository {
    public async findById(round: number): Promise<Contracts.Database.Round[]> {
        return this.db.manyOrNone(queries.rounds.find, { round });
    }

    public async delete(round: number, db?: any): Promise<void> {
        db = db || this.db;
        return db.none(queries.rounds.delete, { round });
    }

    public async insert(delegates: Contracts.State.Wallet[]): Promise<void> {
        const rounds: Array<Partial<Contracts.Database.Round>> = delegates.map(delegate => {
            return {
                publicKey: delegate.publicKey,
                balance: delegate.getAttribute("delegate.voteBalance"),
                round: delegate.getAttribute("delegate.round"),
            };
        });

        await super.insert(rounds);
    }

    public async update(items: object | object[]): Promise<void> {
        return;
    }

    public getModel(): Round {
        return new Round(this.pgp);
    }
}
