import "jest-extended";

import { Container, Services } from "@packages/core-kernel";
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

describe("searchEntries", () => {
    it("should search wallets only by `address`", () => {
        const wallets = fixtureGenerator.generateFullWallets();

        const addresses = [wallets[1].address, wallets[3].address, wallets[9].address];

        const query = {
            exact: ["publicKey", "secondPublicKey", "username", "vote"],
            between: ["balance", "voteBalance", "lockedBalance"],
            in: ["address"],
        };
        const defaultOrder = ["balance", "desc"];

        const result = searchEntries({ addresses }, query, wallets, defaultOrder);

        expect(result.count).toEqual(3);
    });

    it("should return nothing is addresses and address params are passed", () => {
        const wallets = fixtureGenerator.generateFullWallets();

        const { address } = wallets[0];
        const addresses = [wallets[1].address, wallets[3].address, wallets[9].address];

        const query = {
            exact: ["publicKey", "secondPublicKey", "username", "vote"],
            between: ["balance", "voteBalance", "lockedBalance"],
            in: ["address"],
        };
        const defaultOrder = ["balance", "desc"];

        const result = searchEntries({ addresses, address }, query, wallets, defaultOrder);

        expect(result.count).toEqual(0);
    });

    it("should accept orderBy parameter also", () => {
        const wallets = fixtureGenerator.generateFullWallets();
        for (let i = 0; i < wallets.length; i++) {
            const wallet = wallets[i];
            if (i < 17) {
                wallet.setAttribute("delegate.voteBalance", Utils.BigNumber.make(12));
            } else if (i < 29) {
                wallet.setAttribute("delegate.voteBalance", Utils.BigNumber.make(17));
            }
        }

        const params = {
            orderBy: "voteBalance",
            voteBalance: {
                from: 11,
                to: 18,
            },
        };

        const query = {
            exact: ["publicKey", "secondPublicKey", "username", "vote"],
            between: ["balance", "voteBalance", "lockedBalance"],
            in: ["address"],
        };
        const defaultOrder = ["balance", "desc"];

        const result = searchEntries(params, query, wallets, defaultOrder);

        expect(result.count).toEqual(29);
    });

    it("should order by votes", () => {
        const wallets = fixtureGenerator.generateFullWallets();
        for (let i = 0; i < wallets.length; i++) {
            const wallet = wallets[i];
            if (i < 17) {
                wallet.setAttribute("delegate.voteBalance", Utils.BigNumber.make(12));
            } else if (i < 29) {
                wallet.setAttribute("delegate.voteBalance", Utils.BigNumber.make(17));
            }
        }

        const params = {
            orderBy: "votes:asc",
            voteBalance: {
                from: 11,
                to: 18,
            },
        };

        const query = {
            exact: ["publicKey", "secondPublicKey", "username", "vote"],
            between: ["balance", "voteBalance", "lockedBalance"],
            in: ["address"],
        };
        const defaultOrder = ["balance", "desc"];

        const result = searchEntries(params, query, wallets, defaultOrder);

        expect(result.count).toEqual(29);
    });
});
