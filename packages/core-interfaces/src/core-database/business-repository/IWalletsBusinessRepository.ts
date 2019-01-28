import { models } from "@arkecosystem/crypto";
import { IParameters } from "./IParameters";

export interface IWalletsBusinessRepository {

    all(): models.Wallet[];

    findAll(params: IParameters): { count: number, rows: models.Wallet[] }

    findAllByVote(publicKey: string, params: IParameters): { count: number, rows: models.Wallet[] };

    findById(id: string): models.Wallet;

    count(): number;

    top(params: IParameters): { count: number, rows: models.Wallet[] }

    search<T extends IParameters>(params: T): { count: number, rows: models.Wallet[] }

}
