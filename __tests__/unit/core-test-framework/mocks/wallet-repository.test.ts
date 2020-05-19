import "jest-extended";

import { CryptoSuite } from "@packages/core-crypto";

import { WalletRepository } from "../../../../packages/core-test-framework/src/mocks";

describe("WalletRepository", () => {
    describe("default values", () => {
        let walletRepository;
        let Utils;

        beforeEach(() => {
            const crypto = new CryptoSuite.CryptoSuite();
            Utils = crypto.CryptoManager.LibraryManager.Libraries;
            walletRepository = new WalletRepository.WalletRepository(crypto.CryptoManager);
        });

        it("getNonce should be 1", async () => {
            expect(walletRepository.getNonce("dummy public key")).toEqual(Utils.BigNumber.make(1));
        });
    });

    describe("setNonce", () => {
        let walletRepository;
        let Utils;
        beforeEach(() => {
            const crypto = new CryptoSuite.CryptoSuite();
            Utils = crypto.CryptoManager.LibraryManager.Libraries;
            walletRepository = new WalletRepository.WalletRepository(crypto.CryptoManager);
            walletRepository.setNonce(Utils.BigNumber.make(5));
        });

        it("getNonce should return mocked value", async () => {
            expect(walletRepository.getNonce("dummy public key")).toEqual(Utils.BigNumber.make(5));
        });
    });
});
