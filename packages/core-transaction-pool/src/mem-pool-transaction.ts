// tslint:disable:variable-name

import { constants, Transaction } from "@arkecosystem/crypto";
import assert from "assert";

const { TransactionTypes } = constants;

/**
 * A mem pool transaction.
 * A normal transaction
 * + a sequence number used to order by insertion time
 * + a get-expiration-time method used to remove old transactions from the pool
 */
export class MemPoolTransaction {
    private _transaction: Transaction;
    private _sequence: number;

    /**
     * Construct a MemPoolTransaction object.
     */
    constructor(transaction: Transaction, sequence?: number) {
        assert(transaction instanceof Transaction);
        this._transaction = transaction;

        if (sequence !== undefined) {
            assert(Number.isInteger(sequence));
            this._sequence = sequence;
        }
    }

    get transaction(): Transaction {
        return this._transaction;
    }

    get sequence(): number {
        return this._sequence;
    }

    set sequence(seq: number) {
        assert.strictEqual(this._sequence, undefined);
        this._sequence = seq;
    }

    /**
     * Derive the transaction expiration time in number of seconds since
     * the genesis block.
     * @param {Number} maxTransactionAge maximum age (in seconds) of a transaction
     * @return {Number} expiration time or null if the transaction does not expire
     */
    public expireAt(maxTransactionAge: number): number {
        const t = this._transaction;

        if (t.data.expiration > 0) {
            return t.data.expiration;
        }

        if (t.type !== TransactionTypes.TimelockTransfer) {
            return t.data.timestamp + maxTransactionAge;
        }

        return null;
    }
}
