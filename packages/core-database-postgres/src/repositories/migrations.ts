import { Migration } from "../models";
import { queries } from "../queries";
import { Repository } from "./repository";

const { migrations: sql } = queries;

// @TODO: add database migration interface
export class MigrationsRepository extends Repository {
    /**
     * Find a migration by its name.
     * @param  {String} name
     * @return {Promise}
     */
    public async findByName(name) {
        return this.db.oneOrNone(sql.find, { name });
    }

    /**
     * Get the model related to this repository.
     * @return {Migration}
     */
    public getModel() {
        return new Migration(this.pgp);
    }
}
