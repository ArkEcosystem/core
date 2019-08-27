import { Repository } from "./repository";

export interface Round {
    id: number;
    publicKey: string;
    balance: string;
    round: number;
}

export interface RoundsRepository extends Repository {
    findById(id: number): Promise<Round[]>;
    delete(id: number, db?: any): Promise<void>;
}
