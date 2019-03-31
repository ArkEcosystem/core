import { IRepository } from "./repository";

export interface IRound {
    id: number;
    publicKey: string;
    balance: string;
    round: number;
}

export interface IRoundsRepository extends IRepository {
    /**
     * Find a round by its ID.
     */
    findById(id: number): Promise<IRound[]>;

    /**
     * Delete the round from the database.
     */
    delete(id: number): Promise<void>;
}
