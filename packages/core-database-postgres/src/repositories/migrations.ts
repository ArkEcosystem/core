import { Container } from "@arkecosystem/core-kernel";
import { Migration as MigrationContract } from "../interfaces";
import { Migration } from "../models";
import { queries } from "../queries";
import { Repository } from "./repository";

@Container.injectable()
export class MigrationsRepository extends Repository {
    public async findByName(name: string): Promise<MigrationContract> {
        return this.db.oneOrNone(queries.migrations.find, { name });
    }

    public getModel(): Migration {
        return new Migration(this.pgp);
    }
}
