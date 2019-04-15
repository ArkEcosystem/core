import { Database } from "@arkecosystem/core-interfaces";
import { Round } from "../models";
import { queries } from "../queries";
import { Repository } from "./repository";

// @TODO: add database round interface
export class RoundsRepository extends Repository implements Database.IRoundsRepository {
    public async findById(round: number): Promise<Database.IRound[]> {
        return this.db.manyOrNone(queries.rounds.find, { round });
    }

    public async delete(round: number): Promise<void> {
        return this.db.none(queries.rounds.delete, { round });
    }

    public getModel(): Round {
        return new Round(this.pgp);
    }
}
