import { IRepository } from "./repository";

export interface IWalletsRepository extends IRepository {
    /**
     * Get all of the wallets from the database.
     */
    all(): Promise<any[]>;

    /**
     * Find a wallet by its address.
     */
    findByAddress(address: string): Promise<any>;

    /**
     * Get the count of wallets that have a negative balance.
     */
    tallyWithNegativeBalance(): Promise<number>;

    /**
     * Get the count of wallets that have a negative vote balance.
     */
    tallyWithNegativeVoteBalance(): Promise<number>;

    /**
     * Create or update a record matching the attributes, and fill it with values.
     */
    updateOrCreate(wallet: any): Promise<void>;
}
