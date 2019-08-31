import { Migration as MigrationContract } from "../interfaces";
import { Migration } from "../models";
import { queries } from "../queries";
import { Repository } from "./repository";

export class MigrationsRepository extends Repository {
    public async findByName(name: string): Promise<MigrationContract> {
        return this.db.oneOrNone(queries.migrations.find, { name });
    }

    public getModel(): Migration {
        return new Migration(this.pgp);
    }
}
