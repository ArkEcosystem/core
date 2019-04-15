import { IMigration } from "../interfaces";
import { Migration } from "../models";
import { queries } from "../queries";
import { Repository } from "./repository";

// @TODO: add database migration interface
export class MigrationsRepository extends Repository {
    public async findByName(name: string): Promise<IMigration> {
        return this.db.oneOrNone(queries.migrations.find, { name });
    }

    public getModel(): Migration {
        return new Migration(this.pgp);
    }
}
