import { IMigration } from "../interfaces";
import { Migration } from "../models";
import { Repository } from "./repository";
export declare class MigrationsRepository extends Repository {
    findByName(name: string): Promise<IMigration>;
    getModel(): Migration;
}
