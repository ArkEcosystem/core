import "jest-extended";

import { Container, Services } from "@packages/core-kernel";
import { sortEntries } from "@packages/core-state/src/wallets/utils/sort-entries";

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

describe("sortEntries", () => {
    it("should sort entries using an iteratee", () => {
        const entries = fixtureGenerator.generateFullWallets();
        const collectThird = entry => entry !== entries[3];
        const thirdNowAtStart = moveIndexToFrontofArray(3, entries);
        const actual = sortEntries({ orderBy: [collectThird, "asc"] }, entries, entries[0]);

        expect(actual).toEqual(thirdNowAtStart);
    });
});
