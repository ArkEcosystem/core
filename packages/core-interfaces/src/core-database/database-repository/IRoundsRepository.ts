import { IRepository } from "./IRepository";

export interface IRoundsRepository extends IRepository {
    /**
     * Find a round by its ID.
     */
    findById(id: string): Promise<any>;

    /**
     * Delete the round from the database.
     */
    delete(id: string): Promise<any>;
}
