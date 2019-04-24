// tslint:disable:variable-name

import { Enums, Interfaces } from "@arkecosystem/crypto";
import assert from "assert";

export class MemoryTransaction {
    // @TODO: remove the need for disabling tslint rules
    private _sequence: number;

    constructor(readonly transaction: Interfaces.ITransaction, sequence?: number) {
        if (sequence !== undefined) {
            assert(Number.isInteger(sequence));

            this._sequence = sequence;
        }
    }

    get sequence(): number {
        return this._sequence;
    }

    set sequence(seq: number) {
        assert.strictEqual(this._sequence, undefined);

        this._sequence = seq;
    }

    public expiresAt(maxTransactionAge: number): number {
        const transaction: Interfaces.ITransaction = this.transaction;

        if (transaction.data.expiration > 0) {
            return transaction.data.expiration;
        }

        if (transaction.type !== Enums.TransactionTypes.TimelockTransfer) {
            return transaction.data.timestamp + maxTransactionAge;
        }

        return null;
    }
}
