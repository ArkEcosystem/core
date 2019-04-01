import { Database } from "@arkecosystem/core-interfaces";
import { Round } from "../models";
import { queries } from "../queries";
import { Repository } from "./repository";

const { rounds: sql } = queries;

export class RoundsRepository extends Repository implements Database.IRoundsRepository {
    /**
     * Find a round by its ID.
     * @param  {Number} round
     * @return {Promise}
     */
    public async findById(round: number): Promise<Database.IRound[]> {
        return this.db.manyOrNone(sql.find, { round });
    }

    /**
     * Delete the round from the database.
     * @param  {Number} round
     * @return {Promise}
     */
    public async delete(round): Promise<void> {
        return this.db.none(sql.delete, { round });
    }

    /**
     * Get the model related to this repository.
     * @return {Round}
     */
    public getModel(): Round {
        return new Round(this.pgp);
    }
}
