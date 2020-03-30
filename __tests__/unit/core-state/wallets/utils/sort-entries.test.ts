import "jest-extended";

import { Container, Services } from "@packages/core-kernel";
import { sortEntries } from "@packages/core-state/src/wallets/utils/sort-entries";
import { Utils } from "@packages/crypto/src";

import { FixtureGenerator } from "../../__utils__/fixture-generator";
import { setUp } from "../../setup";

let fixtureGenerator: FixtureGenerator;
let attributeSet: Services.Attributes.AttributeSet;

beforeAll(async () => {
    const initialEnv = await setUp();

    const cryptoConfig: any = initialEnv.sandbox.app
        .get<Services.Config.ConfigRepository>(Container.Identifiers.ConfigRepository)
        .get("crypto");

    const genesisBlock = cryptoConfig.genesisBlock;

    attributeSet = initialEnv.sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes);

    fixtureGenerator = new FixtureGenerator(genesisBlock, attributeSet);
});

const moveIndexToFrontofArray = (index, array) =>
    array
        .slice(index, index + 1)
        .concat(array.slice(0, index))
        .concat(array.slice(index + 1));

const moveIndexToBackOfArray = (index, array) =>
    array
        .slice(0, index)
        .concat(array.slice(index + 1))
        .concat(array.slice(index, index + 1));

describe("sortEntries", () => {
    it("should sort entries using an iteratee", () => {
        const entries = fixtureGenerator.generateFullWallets();
        const collectThird = (entry) => entry !== entries[3];
        const thirdNowAtStart = moveIndexToFrontofArray(3, entries);
        const actual = sortEntries([collectThird, "asc"], entries);

        expect(actual).toEqual(thirdNowAtStart);
    });

    it("should use default value if there is no orderBy set - asc", () => {
        const wallets = fixtureGenerator.generateFullWallets();
        wallets[3].setAttribute("delegate", {
            balance: Utils.BigNumber.make(500),
        });

        const actual = sortEntries(["balance", "asc"], wallets);
        const thirdNowAtBack = moveIndexToBackOfArray(3, wallets);

        expect(actual).toEqual(thirdNowAtBack);
    });

    it("should use default value if there is no orderBy set - desc", () => {
        const wallets = fixtureGenerator.generateFullWallets();
        wallets[3].setAttribute("delegate", {
            balance: Utils.BigNumber.make(500),
        });

        const actual = sortEntries(["balance", "desc"], wallets);
        const thirdNowAtFront = moveIndexToFrontofArray(3, wallets);

        expect(actual).toEqual(thirdNowAtFront);
    });

    it("should default to 0 balance when not set", () => {
        const wallets = fixtureGenerator.generateFullWallets();
        wallets[3].forgetAttribute("delegate");
        wallets[5].forgetAttribute("delegate");

        const actual = sortEntries(["voteBalance", "asc"], wallets);

        expect(actual[0]).toEqual(wallets[3]);
        expect(actual[1]).toEqual(wallets[5]);
    });
});
