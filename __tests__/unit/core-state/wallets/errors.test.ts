import "jest-extended";

import {
    WalletIndexAlreadyRegisteredError,
    WalletIndexNotFoundError,
    WalletsError,
} from "@packages/core-state/src/wallets/errors";

describe("WalletErrors", () => {
    it("should construct base wallet error", () => {
        const message = "I am an error";
        const error = new WalletsError(message);
        expect(() => {
            throw error;
        }).toThrow(message);
        expect(error.stack).toBeDefined();
    });

    it("should construct WalletIndexAlreadyRegisteredError", () => {
        const message = "custom message";
        const error = new WalletIndexAlreadyRegisteredError(message);
        expect(() => {
            throw error;
        }).toThrow(`The wallet index is already registered: ${message}`);
        expect(error.stack).toBeDefined();
    });

    it("should construct WalletIndexNotFoundError", () => {
        const message = "custom message";
        const error = new WalletIndexNotFoundError(message);
        expect(() => {
            throw error;
        }).toThrow(`The wallet index does not exist: ${message}`);
        expect(error.stack).toBeDefined();
    });
});
