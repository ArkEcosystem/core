import { strict } from "assert";
import { Blocks, Transactions } from "@arkecosystem/crypto";

export const assert = {
    defined: (value: unknown): void => strict.notEqual(value, undefined, "Expected the input to be defined."),
    null: (value: unknown): void => strict.equal(value, null, "Expected the input to be null."),
    sameLength: (a: string | unknown[], b: string | unknown[]): void =>
        strict.equal(a.length, b.length, "Expected the inputs to have the same length."),
    block: (value: unknown): void =>
        strict.equal(value instanceof Blocks.Block, true, "Expected the input to be a block instance."),
    transaction: (value: unknown): void =>
        strict.equal(
            value instanceof Transactions.Transaction,
            true,
            "Expected the input to be a transaction instance.",
        ),
    not: {
        defined: (value: unknown): void => strict.equal(value, undefined, "Expected the input not to be defined."),
        null: (value: unknown): void => strict.notEqual(value, null, "Expected the input not to be null."),
        sameLength: (a: string | unknown[], b: string | unknown[]): void =>
            strict.notEqual(a.length, b.length, "Expected the inputs not to have the same length."),
        block: (value: unknown): void =>
            strict.equal(value instanceof Blocks.Block, false, "Expected the input not to be a block instance."),
        transaction: (value: unknown): void =>
            strict.equal(
                value instanceof Transactions.Transaction,
                false,
                "Expected the input not to be a transaction instance.",
            ),
    },
};
