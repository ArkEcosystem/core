import { IModel } from "../database-model";

export interface IRepository {
    getModel(): IModel;

    truncate(): Promise<void>;

    insert(item: object | object[], db?: any): Promise<void>;

    update(item: object | object[]): Promise<void>;
}
