// @ts-nocheck
import "jest-extended";

import { Container, Contracts, Services } from "@packages/core-kernel";
import {
    addressesIndexer,
    publicKeysIndexer,
    usernamesIndexer,
    WalletRepository,
    WalletRepositoryClone,
    Wallet,
} from "@packages/core-state/src/wallets";
import { walletFactory } from "@packages/core-state/src/wallets/wallet-factory";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let walletRepositoryBlockchain: WalletRepository;
let walletRepositoryClone: WalletRepositoryClone;

beforeEach(() => {
    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.WalletAttributes).to(Services.Attributes.AttributeSet).inSingletonScope();

    sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set("delegate");
    sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set("delegate.username");
    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("delegate.voteBalance");
    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("delegate.producedBlocks");
    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("delegate.forgedTotal");
    sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set("delegate.approval");
    sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set("delegate.resigned");
    sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set("delegate.rank");
    sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set("delegate.round");
    sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set("ipfs");
    sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set("ipfs.hashes");

    sandbox.app.bind(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.Addresses,
        indexer: addressesIndexer,
        autoIndex: true,
    });

    sandbox.app.bind(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.PublicKeys,
        indexer: publicKeysIndexer,
        autoIndex: true,
    });

    sandbox.app.bind(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.Usernames,
        indexer: usernamesIndexer,
        autoIndex: true,
    });

    sandbox.app
        .bind(Container.Identifiers.WalletFactory)
        .toFactory(({ container }) => {
            return walletFactory(container.get(Container.Identifiers.WalletAttributes));
        })
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "blockchain"));

    sandbox.app
        .bind(Container.Identifiers.WalletFactory)
        .toFactory(({ container }) => {
            return walletFactory(container.get(Container.Identifiers.WalletAttributes));
        })
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "clone"));

    sandbox.app
        .bind(Container.Identifiers.WalletRepository)
        .to(WalletRepository)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "blockchain"));

    sandbox.app
        .bind(Container.Identifiers.WalletRepository)
        .to(WalletRepositoryClone)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "clone"));

    walletRepositoryBlockchain = sandbox.app.getTagged<WalletRepositoryClone>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    walletRepositoryClone = sandbox.app.getTagged<WalletRepositoryClone>(
        Container.Identifiers.WalletRepository,
        "state",
        "clone",
    );
});

describe("Wallet Repository Clone", () => {
    describe("createWallet", () => {
        it("should create wallet by address", () => {
            const wallet = walletRepositoryClone.createWallet("address");

            expect(wallet).toBeInstanceOf(Wallet);
            expect(wallet.address).toEqual("address");
        });
    });

    describe("getIndex", () => {
        // TODO
    });

    describe("getIndexNames", () => {
        it("should return index names", () => {
            walletRepositoryClone.getIndexNames();

            expect(walletRepositoryClone.getIndexNames()).toEqual(["addresses", "publicKeys", "usernames"]);
        });
    });
});
