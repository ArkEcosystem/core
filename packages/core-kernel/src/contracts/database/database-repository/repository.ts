import { Model } from "../database-model";

export interface Repository {
    getModel(): Model;

    truncate(): Promise<void>;

    insert(item: object | object[], db?: any): Promise<void>;

    update(item: object | object[]): Promise<void>;
}
