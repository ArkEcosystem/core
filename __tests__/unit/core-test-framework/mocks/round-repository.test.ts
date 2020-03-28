import "jest-extended";

import { RoundRepository } from "@packages/core-test-framework/src/mocks";
import { Identities, Utils } from "@packages/crypto";
import { Models } from "@packages/core-database";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";

const round: Models.Round = {
    publicKey: Identities.PublicKey.fromPassphrase(passphrases[1]),
    round: Utils.BigNumber.make("12"),
    balance: Utils.BigNumber.make("555"),
};

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
