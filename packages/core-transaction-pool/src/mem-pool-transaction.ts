// tslint:disable:variable-name

import { constants, models } from "@arkecosystem/crypto";
import assert from "assert";

const { TransactionTypes } = constants;
const { Transaction } = models;

/**
 * A mem pool transaction.
 * A normal transaction
 * + a sequence number used to order by insertion time
 * + a get-expiration-time method used to remove old transactions from the pool
 */
export class MemPoolTransaction {
    private _transaction: any;
    private _sequence: number;

    /**
     * Construct a MemPoolTransaction object.
     * @param {Transaction} transaction base transaction object
     * @param {Number}      sequence    insertion order sequence or undefined;
     *                                  if this is undefined at creation time,
     *                                  then it is assigned later using the
     *                                  setter method below
     */
    constructor(transaction, sequence?) {
        assert(transaction instanceof Transaction);
        this.transaction = transaction;

        if (sequence !== undefined) {
            assert(Number.isInteger(sequence));
            this.sequence = sequence;
        }
    }

    get transaction() {
        return this.transaction;
    }

    get sequence() {
        return this.sequence;
    }

    set sequence(seq) {
        assert.strictEqual(this.sequence, undefined);
        this.sequence = seq;
    }

    /**
     * Derive the transaction expiration time in number of seconds since
     * the genesis block.
     * @param {Number} maxTransactionAge maximum age (in seconds) of a transaction
     * @return {Number} expiration time or null if the transaction does not expire
     */
    public expireAt(maxTransactionAge) {
        const t = this.transaction;

        if (t.expiration > 0) {
            return t.expiration;
        }

        if (t.type !== TransactionTypes.TimelockTransfer) {
            return t.timestamp + maxTransactionAge;
        }

        return null;
    }
}
