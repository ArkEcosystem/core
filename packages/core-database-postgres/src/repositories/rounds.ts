import { Contracts } from "@arkecosystem/core-kernel";
import { Round } from "../models";
import { queries } from "../queries";
import { Repository } from "./repository";

export class RoundsRepository extends Repository implements Contracts.Database.IRoundsRepository {
    public async findById(round: number): Promise<Contracts.Database.IRound[]> {
        return this.db.manyOrNone(queries.rounds.find, { round });
    }

    public async delete(round: number, db?: any): Promise<void> {
        db = db || this.db;
        return db.none(queries.rounds.delete, { round });
    }

    public async insert(delegates: Contracts.State.IWallet[]): Promise<void> {
        const rounds: Array<Partial<Contracts.Database.IRound>> = delegates.map(delegate => {
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
