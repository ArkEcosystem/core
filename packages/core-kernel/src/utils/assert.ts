import { Blocks, Transactions } from "@arkecosystem/crypto";
import { notStrictEqual, strictEqual } from "assert";

export const assert = {
    defined: <T>(value: unknown, message?: string): T => {
        notStrictEqual(value, undefined, message || "Expected the input to be defined.");

        return value as T;
    },
    null: <T>(value: unknown, message?: string): T => {
        strictEqual(value, null, message || "Expected the input to be null.");

        return value as T;
    },
    sameLength: (a: string | unknown[], b: string | unknown[], message?: string): void =>
        strictEqual(a.length, b.length, message || "Expected the inputs to have the same length."),
    block: <T>(value: unknown, message?: string): T => {
        strictEqual(value instanceof Blocks.Block, true, message || "Expected the input to be a block instance.");

        return value as T;
    },
    transaction: <T>(value: unknown, message?: string): T => {
        strictEqual(
            value instanceof Transactions.Transaction,
            true,
            message || "Expected the input to be a transaction instance.",
        );

        return value as T;
    },
    not: {
        defined: <T>(value: unknown, message?: string): T => {
            strictEqual(value, undefined, message || "Expected the input not to be defined.");

            return value as T;
        },
        null: <T>(value: unknown, message?: string): T => {
            notStrictEqual(value, null, message || "Expected the input not to be null.");

            return value as T;
        },
        sameLength: (a: string | unknown[], b: string | unknown[], message?: string): void =>
            notStrictEqual(a.length, b.length, message || "Expected the inputs not to have the same length."),
        block: <T>(value: unknown, message?: string): T => {
            strictEqual(
                value instanceof Blocks.Block,
                false,
                message || "Expected the input not to be a block instance.",
            );

            return value as T;
        },
        transaction: <T>(value: unknown, message?: string): T => {
            strictEqual(
                value instanceof Transactions.Transaction,
                false,
                message || "Expected the input not to be a transaction instance.",
            );

            return value as T;
        },
    },
};
