import { Blocks, Transactions } from "@arkecosystem/crypto";

import { AssertionException } from "../exceptions/runtime";

export const assert = {
    defined: <T>(value: unknown, message?: string): T => {
        if (value === undefined) {
            throw new AssertionException(message || "Expected the input to be defined.");
        }

        return value as T;
    },
    null: <T>(value: unknown, message?: string): T => {
        if (value !== null) {
            throw new AssertionException(message || "Expected the input to be null.");
        }

        return value as T;
    },
    sameLength: (a: string | unknown[], b: string | unknown[], message?: string): void => {
        if (a.length !== b.length) {
            throw new AssertionException(message || "Expected the inputs to have the same length.");
        }
    },
    block: <T>(value: unknown, message?: string): T => {
        if (!(value instanceof Blocks.Block)) {
            throw new AssertionException(message || "Expected the input to be a block instance.");
        }

        return (value as unknown) as T;
    },
    transaction: <T>(value: unknown, message?: string): T => {
        if (!(value instanceof Transactions.Transaction)) {
            throw new AssertionException(message || "Expected the input to be a transaction instance.")
        }

        return (value as unknown) as T;
    },
    not: {
        defined: <T>(value: unknown, message?: string): T => {
            if (value !== undefined) {
                throw new AssertionException(message || "Expected the input not to be defined.");
            }

            return value as T;
        },
        null: <T>(value: unknown, message?: string): T => {
            if (value === null) {
                throw new AssertionException(message || "Expected the input not to be null.");
            }

            return value as T;
        },
        sameLength: (a: string | unknown[], b: string | unknown[], message?: string): void => {
            if (a.length === b.length) {
                throw new AssertionException(message || "Expected the inputs not to have the same length.");
            }
        },
        block: <T>(value: unknown, message?: string): T => {
            if (value instanceof Blocks.Block) {
                throw new AssertionException(message || "Expected the input not to be a block instance.");
            }

            return value as T;
        },
        transaction: <T>(value: unknown, message?: string): T => {
            if (value instanceof Transactions.Transaction) {
                throw new AssertionException(message || "Expected the input not to be a transaction instance.");
            }

            return value as T;
        },
    },
};
