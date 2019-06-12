import { IModel } from "../database-model";

export interface IRepository {
    getModel(): IModel;

    truncate(): Promise<void>;

    insert(item: object | object[]): Promise<void>;

    update(item: object | object[]): Promise<void>;
}
