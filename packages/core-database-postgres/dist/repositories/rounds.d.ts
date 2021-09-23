import { Database, State } from "@arkecosystem/core-interfaces";
import { Round } from "../models";
import { Repository } from "./repository";
export declare class RoundsRepository extends Repository implements Database.IRoundsRepository {
    findById(round: number): Promise<Database.IRound[]>;
    delete(round: number, db?: any): Promise<void>;
    insert(delegates: State.IWallet[]): Promise<void>;
    update(items: object | object[]): Promise<void>;
    getModel(): Round;
}
