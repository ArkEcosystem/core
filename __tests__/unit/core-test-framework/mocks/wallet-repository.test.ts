import "jest-extended";

import { WalletRepository } from "@packages/core-test-framework/src/mocks";
import { Utils } from "@packages/crypto";

const clear = () => {
    WalletRepository.setNonce(Utils.BigNumber.make(1));
};

describe("WalletRepository", () => {
    describe("default values", () => {
        it("getNonce should be 1", async () => {
            expect(WalletRepository.instance.getNonce("dummy public key")).toEqual(Utils.BigNumber.make(1));
        });
    });

    describe("setNonce", () => {
        beforeEach(() => {
            clear();

            WalletRepository.setNonce(Utils.BigNumber.make(5));
        });

        it("getNonce should return mocked value", async () => {
            expect(WalletRepository.instance.getNonce("dummy public key")).toEqual(Utils.BigNumber.make(5));
        });
    });
});
