import { IRepository } from "./repository";

export interface IRoundsRepository extends IRepository {
    /**
     * Find a round by its ID.
     */
    findById(id: number): Promise<any>;

    /**
     * Delete the round from the database.
     */
    delete(id: number): Promise<any>;
}
