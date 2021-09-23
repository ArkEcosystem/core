import { Interfaces } from "@arkecosystem/crypto";
export declare class Memory {
    private readonly maxTransactionAge;
    /**
     * An array of all transactions, possibly sorted by fee (highest fee first).
     * We use lazy sorting:
     * - insertion just appends at the end, complexity: O(1) + flag it as unsorted
     * - deletion removes by using splice(), complexity: O(n) + flag it as unsorted
     * - lookup sorts if it is not sorted, complexity: O(n*log(n) + flag it as sorted
     */
    private all;
    private allIsSorted;
    private byId;
    private bySender;
    private byType;
    private byFee;
    /**
     * Contains only transactions that expire, possibly sorted by height (lower first).
     */
    private byExpiration;
    private byExpirationIsSorted;
    private readonly dirty;
    constructor(maxTransactionAge: number);
    sortedByFee(limit?: number): Interfaces.ITransaction[];
    getExpired(): Interfaces.ITransaction[];
    getInvalid(): Interfaces.ITransaction[];
    getById(id: string): Interfaces.ITransaction | undefined;
    getByType(type: number, typeGroup: number): Set<Interfaces.ITransaction>;
    getBySender(senderPublicKey: string): Interfaces.ITransaction[];
    getLowestFeeLastNonce(): Interfaces.ITransaction | undefined;
    remember(transaction: Interfaces.ITransaction, databaseReady?: boolean): void;
    forget(id: string, senderPublicKey?: string): void;
    has(id: string): boolean;
    flush(): void;
    count(): number;
    countDirty(): number;
    pullDirtyAdded(): Interfaces.ITransaction[];
    pullDirtyRemoved(): string[];
    /**
     * Sort `this.all` by fee (highest fee first) with the exception that transactions
     * from the same sender must be ordered lowest `nonce` first.
     */
    private sort;
    private currentHeight;
}
