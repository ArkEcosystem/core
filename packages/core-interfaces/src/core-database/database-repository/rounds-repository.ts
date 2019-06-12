import { IRepository } from "./repository";

export interface IRound {
    id: number;
    publicKey: string;
    balance: string;
    round: number;
}

export interface IRoundsRepository extends IRepository {
    findById(id: number): Promise<IRound[]>;
    delete(id: number): Promise<void>;
}
