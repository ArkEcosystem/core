// tslint:disable:variable-name

import { Interfaces } from "@arkecosystem/crypto";
import assert from "assert";

/**
 * A mem pool transaction.
 * A normal transaction
 * + a sequence number used to order by insertion time
 */
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
}
