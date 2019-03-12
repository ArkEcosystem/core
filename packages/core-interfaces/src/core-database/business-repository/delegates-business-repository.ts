import { models } from "@arkecosystem/crypto";
import { IParameters } from "./parameters";

export interface IDelegatesBusinessRepository {
    getLocalDelegates(): models.Wallet[];

    findAll(params?: IParameters): { count: number; rows: models.Wallet[] };

    search<T extends IParameters>(params: T): { count: number; rows: models.Wallet[] };

    findById(id: string): models.Wallet;

    getActiveAtHeight(height: number): Promise<models.Wallet[]>;
}
