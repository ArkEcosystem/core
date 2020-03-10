import "jest-extended";

import { Container, Contracts, Services } from "@packages/core-kernel";
import { searchEntries } from "@packages/core-state/src/wallets/utils/search-entries";
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

describe("searchEntries", () => {
    it("should search wallets only by `address`", () => {
        const wallets = fixtureGenerator.generateFullWallets();

        const addresses = [wallets[1].address, wallets[3].address, wallets[9].address];

        const query = {
            exact: [ 'publicKey', 'secondPublicKey', 'username', 'vote' ],
            between: [ 'balance', 'voteBalance', 'lockedBalance' ],
            in: [ 'address' ]
        };
        const defaultOrder = [ 'balance', 'desc' ];

        const result = searchEntries({ addresses }, query, wallets, defaultOrder);

        expect(result.count).toEqual(3);
    });
});
