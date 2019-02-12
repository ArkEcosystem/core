import { IDatabaseModel } from "../database-model";

export interface IRepository {

    getModel(): IDatabaseModel;

    estimate() : Promise<number>;

    truncate(): Promise<void>;

    insert(item: any | any[]) : Promise<void>;

    update(item: any | any[]) : Promise<void>;

}
