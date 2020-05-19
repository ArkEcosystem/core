import "jest-extended";

import { CryptoSuite } from "@packages/core-crypto";
import { Models } from "@packages/core-database";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { RoundRepository } from "@packages/core-test-framework/src/mocks";

let round: Models.Round;

beforeAll(() => {
    const crypto = new CryptoSuite.CryptoSuite();
    round = {
        publicKey: crypto.CryptoManager.Identities.PublicKey.fromPassphrase(passphrases[1]),
        round: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("12"),
        balance: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("555"),
    };
});

const clear = () => {
    RoundRepository.setRounds([]);
};

describe("RoundRepository", () => {
    describe("default values", () => {
        it("findById should return empty array", async () => {
            await expect(RoundRepository.instance.findById("1")).resolves.toEqual([]);
        });
    });

    describe("setRounds", () => {
        beforeEach(() => {
            clear();

            RoundRepository.setRounds([round]);
        });

        it("findById should return mocked rounds", async () => {
            await expect(RoundRepository.instance.findById("1")).resolves.toEqual([round]);
        });
    });
});
