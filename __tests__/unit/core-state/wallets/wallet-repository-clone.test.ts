import "jest-extended";

import { Utils } from "@arkecosystem/crypto";
import { Container, Contracts, Services } from "@packages/core-kernel";
import {
    addressesIndexer,
    ipfsIndexer,
    publicKeysIndexer,
    usernamesIndexer,
    Wallet,
    WalletRepository,
    WalletRepositoryClone,
} from "@packages/core-state/src/wallets";
import { WalletIndexAlreadyRegisteredError, WalletIndexNotFoundError } from "@packages/core-state/src/wallets/errors";
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

    // Using IPFS index to test autoIndex = false functionality
    sandbox.app.bind(Container.Identifiers.WalletRepositoryIndexerIndex).toConstantValue({
        name: Contracts.State.WalletIndexes.Ipfs,
        indexer: ipfsIndexer,
        autoIndex: false,
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
    describe("initialize", () => {
        it("should throw if wallet index is already registered", () => {
            expect(() => {
                walletRepositoryClone.initialize();
            }).toThrowError(WalletIndexAlreadyRegisteredError);
        });
    });

    describe("createWallet", () => {
        it("should create wallet by address", () => {
            const wallet = walletRepositoryClone.createWallet("address");

            expect(wallet).toBeInstanceOf(Wallet);
            expect(wallet.getAddress()).toEqual("address");
        });
    });

    describe("getIndex", () => {
        it("should return wallet repository clone index", () => {
            walletRepositoryBlockchain.findByAddress("address_1");
            const wallet = walletRepositoryClone.findByAddress("address_2");

            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).values()).toEqual([wallet]);
        });
    });

    describe("getIndexNames", () => {
        it("should return index names", () => {
            expect(walletRepositoryClone.getIndexNames()).toEqual(["addresses", "publicKeys", "usernames", "ipfs"]);
        });
    });

    describe("index", () => {
        it("should index single wallet if there are no changes in indexes", () => {
            const wallet = walletRepositoryClone.findByAddress("address");

            walletRepositoryClone.index(wallet);
        });

        it("should index single wallet if wallet change results in set on index", () => {
            const wallet = walletRepositoryClone.findByAddress("address");
            wallet.setAttribute("delegate.username", "genesis_1");

            expect(
                walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has("genesis_1"),
            ).toBeFalse();

            walletRepositoryClone.index(wallet);

            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has("genesis_1")).toBeTrue();
        });

        it("should index single wallet if wallet change results in forget on index", () => {
            const wallet = walletRepositoryClone.findByAddress("address");
            wallet.setAttribute("delegate.username", "genesis_1");
            walletRepositoryClone.index(wallet);
            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has("genesis_1")).toBeTrue();

            wallet.forgetAttribute("delegate");
            walletRepositoryClone.index(wallet);

            expect(
                walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has("genesis_1"),
            ).toBeFalse();
            expect(
                // @ts-ignore
                walletRepositoryClone.forgetIndexes[Contracts.State.WalletIndexes.Usernames].has("genesis_1"),
            ).toBeTrue();
        });

        it("should index wallet array", () => {
            const wallet1 = walletRepositoryClone.findByAddress("address_1");
            const wallet2 = walletRepositoryClone.findByAddress("address_2");

            walletRepositoryClone.index([wallet1, wallet2]);
        });
    });

    describe("forgetOnIndex", () => {
        it("should clone wallet and set key on forget index if key exists only on blockchain wallet repository", () => {
            const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");
            walletRepositoryBlockchain.getIndex(Contracts.State.WalletIndexes.Ipfs).set("key", blockchainWallet);

            walletRepositoryClone.forgetOnIndex(Contracts.State.WalletIndexes.Ipfs, "key");

            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Ipfs).has("key")).toBeFalse();
            // @ts-ignore
            expect(walletRepositoryClone.forgetIndexes[Contracts.State.WalletIndexes.Ipfs].has("key")).toBeTrue();
            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).has("address")).toBeTrue();
        });

        it("should set key on forget index if key exists on wallet repository clone", () => {
            const wallet = walletRepositoryClone.findByAddress("address");
            walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Ipfs).set("key", wallet);
            expect(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Ipfs, "key")).toBeTrue();

            walletRepositoryClone.forgetOnIndex(Contracts.State.WalletIndexes.Ipfs, "key");

            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Ipfs).has("key")).toBeFalse();
            // @ts-ignore
            expect(walletRepositoryClone.forgetIndexes[Contracts.State.WalletIndexes.Ipfs].has("key")).toBeTrue();
            expect(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Ipfs, "key")).toBeFalse();
        });

        it("should skip setting key if does not exist", () => {
            walletRepositoryClone.forgetOnIndex(Contracts.State.WalletIndexes.Ipfs, "key");

            // @ts-ignore
            expect(walletRepositoryClone.forgetIndexes[Contracts.State.WalletIndexes.Ipfs].has("key")).toBeFalse();
        });
    });

    describe("findByAddress", () => {
        it("should copy and index wallet from blockchain wallet repository if exist in blockchain wallet repository", () => {
            const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");
            expect(walletRepositoryBlockchain.hasByAddress("address")).toBeTrue();
            walletRepositoryBlockchain.getIndex(Contracts.State.WalletIndexes.Ipfs).set("key", blockchainWallet);

            const wallet = walletRepositoryClone.findByAddress("address");

            expect(wallet).not.toBe(blockchainWallet);
            expect(wallet).toEqual(blockchainWallet);
            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).has("address")).toBeTrue();
            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Ipfs).has("key")).toBeTrue();
        });

        it("should create and index new wallet if does not exist in blockchain wallet repository", () => {
            const wallet = walletRepositoryClone.findByAddress("address");

            expect(wallet).toBeInstanceOf(Wallet);
            expect(wallet.getAddress()).toEqual("address");
            expect(walletRepositoryClone.hasByAddress("address")).toBeTrue();
            expect(walletRepositoryBlockchain.hasByAddress("address")).toBeFalse();
        });

        it("should return existing wallet", () => {
            const spyOnCreateWallet = jest.spyOn(walletRepositoryClone, "createWallet");

            const wallet = walletRepositoryClone.findByAddress("address");

            expect(wallet).toBeInstanceOf(Wallet);
            expect(wallet.getAddress()).toEqual("address");
            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).has("address")).toBeTrue();
            expect(spyOnCreateWallet).toHaveBeenCalled();

            spyOnCreateWallet.mockReset();

            const existingWallet = walletRepositoryClone.findByAddress("address");

            expect(wallet).toBe(existingWallet);
            expect(spyOnCreateWallet).not.toHaveBeenCalled();
            expect(walletRepositoryBlockchain.hasByAddress("address")).toBeFalse();
        });
    });

    describe("findByPublicKey", () => {
        const publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";

        it("should copy and index wallet from blockchain wallet repository if exist in blockchain wallet repository", () => {
            const blockchainWallet = walletRepositoryBlockchain.findByPublicKey(publicKey);
            expect(walletRepositoryBlockchain.hasByPublicKey(publicKey)).toBeTrue();
            walletRepositoryBlockchain.getIndex(Contracts.State.WalletIndexes.Ipfs).set("key", blockchainWallet);

            const wallet = walletRepositoryClone.findByPublicKey(publicKey);

            expect(wallet).toBeInstanceOf(Wallet);
            expect(wallet.getPublicKey()).toEqual(publicKey);
            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.PublicKeys).has(publicKey)).toBeTrue();
            expect(
                walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).has(wallet.getAddress()),
            ).toBeTrue();
            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Ipfs).has("key")).toBeTrue();

            expect(wallet).not.toBe(blockchainWallet);
            expect(wallet).toEqual(blockchainWallet);
        });

        it("should create and index new wallet if does not exist in blockchain wallet repository", () => {
            const wallet = walletRepositoryClone.findByPublicKey(publicKey);

            expect(wallet).toBeInstanceOf(Wallet);
            expect(wallet.getPublicKey()).toEqual(publicKey);
            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.PublicKeys).has(publicKey)).toBeTrue();
            expect(
                walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).has(wallet.getAddress()),
            ).toBeTrue();

            expect(walletRepositoryBlockchain.hasByPublicKey(publicKey)).toBeFalse();
            expect(walletRepositoryBlockchain.hasByAddress(wallet.getAddress())).toBeFalse();
        });

        it("should return existing wallet", () => {
            const spyOnCreateWallet = jest.spyOn(walletRepositoryClone, "createWallet");

            const wallet = walletRepositoryClone.findByPublicKey(publicKey);

            expect(wallet).toBeInstanceOf(Wallet);
            expect(wallet.getPublicKey()).toEqual(publicKey);
            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.PublicKeys).has(publicKey)).toBeTrue();
            expect(spyOnCreateWallet).toHaveBeenCalled();

            spyOnCreateWallet.mockReset();
            const existingWallet = walletRepositoryClone.findByPublicKey(publicKey);

            expect(wallet).toBe(existingWallet);
            expect(spyOnCreateWallet).not.toHaveBeenCalled();
            expect(walletRepositoryBlockchain.hasByPublicKey(publicKey)).toBeFalse();
        });
    });

    describe("findByUsername", () => {
        it("should copy and index wallet from blockchain wallet repository if exist in blockchain wallet repository", () => {
            const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");
            blockchainWallet.setAttribute("delegate.username", "genesis_1");
            walletRepositoryBlockchain.index(blockchainWallet);
            expect(walletRepositoryBlockchain.hasByUsername("genesis_1")).toBeTrue();

            const wallet = walletRepositoryClone.findByUsername("genesis_1");

            expect(wallet).not.toBe(blockchainWallet);
            expect(wallet).toEqual(blockchainWallet);
            expect(wallet.getAttribute("delegate.username")).toEqual("genesis_1");
            expect(walletRepositoryClone.hasByUsername("genesis_1")).toBeTrue();
        });

        it("should return existing wallet", () => {
            const wallet = walletRepositoryClone.findByAddress("address");
            wallet.setAttribute("delegate.username", "genesis_1");
            walletRepositoryClone.index(wallet);

            const existingWallet = walletRepositoryClone.findByUsername("genesis_1");
            expect(wallet).toBe(existingWallet);
        });

        it("should throw error if wallet does not exist in blockchain or copy wallet repository", () => {
            expect(() => {
                walletRepositoryClone.findByUsername("genesis_1");
            }).toThrowError("Wallet genesis_1 doesn't exist in index usernames");
        });
    });

    describe("findByIndexes", () => {
        it("should copy and index wallet from blockchain wallet repository if key exist in blockchain wallet repository", () => {
            const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");

            expect(walletRepositoryBlockchain.findByIndexes(["addresses"], "address")).toBe(blockchainWallet);
            expect(walletRepositoryClone.findByIndexes(["addresses"], "address")).not.toBe(blockchainWallet);
            expect(walletRepositoryClone.findByIndexes(["addresses"], "address")).toEqual(blockchainWallet);
            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).has("address")).toBeTrue();
        });

        it("should return wallet from wallet repository clone", () => {
            const wallet = walletRepositoryClone.findByAddress("address");

            expect(walletRepositoryClone.findByIndexes(["addresses"], "address")).toBe(wallet);
            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).has("address")).toBeTrue();
        });

        it("should throw error if wallet does not exist in blockchain or copy wallet repository", () => {
            expect(() => {
                walletRepositoryClone.findByIndexes(["addresses"], "address");
            }).toThrowError("Wallet address doesn't exist in indexes addresses");
        });
    });

    describe("findByIndex", () => {
        const username = "genesis_1";

        it("should copy and index wallet from blockchain wallet repository if exist in blockchain wallet repository", () => {
            const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");
            blockchainWallet.setAttribute("delegate.username", username);
            walletRepositoryBlockchain.index(blockchainWallet);
            walletRepositoryBlockchain.getIndex(Contracts.State.WalletIndexes.Ipfs).set("key", blockchainWallet);
            expect(walletRepositoryBlockchain.hasByIndex(Contracts.State.WalletIndexes.Usernames, username)).toBeTrue();

            const wallet = walletRepositoryClone.findByIndex(Contracts.State.WalletIndexes.Usernames, username);

            expect(wallet).not.toBe(blockchainWallet);
            expect(wallet).toEqual(blockchainWallet);
            expect(wallet.getAttribute("delegate.username")).toEqual(username);
            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has(username)).toBeTrue();
            expect(
                walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).has(wallet.getAddress()),
            ).toBeTrue();
            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Ipfs).has("key")).toBeTrue();
        });

        it("should return existing wallet", () => {
            const spyOnCreateWallet = jest.spyOn(walletRepositoryClone, "createWallet");

            const wallet = walletRepositoryClone.findByAddress("address");
            wallet.setAttribute("delegate.username", username);
            walletRepositoryClone.index(wallet);

            expect(wallet).toBeInstanceOf(Wallet);
            expect(wallet.getAddress()).toEqual("address");
            expect(wallet.getAttribute("delegate.username")).toEqual(username);
            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has(username)).toBeTrue();
            expect(spyOnCreateWallet).toHaveBeenCalled();

            spyOnCreateWallet.mockReset();
            const existingWallet = walletRepositoryClone.findByIndex(Contracts.State.WalletIndexes.Usernames, username);

            expect(wallet).toBe(existingWallet);
            expect(spyOnCreateWallet).not.toHaveBeenCalled();
            expect(
                walletRepositoryBlockchain.hasByIndex(Contracts.State.WalletIndexes.Usernames, username),
            ).toBeFalse();
        });

        it("should throw error if does not exist in blockchain wallet repository", () => {
            expect(() => {
                walletRepositoryClone.findByIndex(Contracts.State.WalletIndexes.Usernames, username);
            }).toThrow("Wallet genesis_1 doesn't exist in index usernames");
        });
    });

    describe("has", () => {
        it("should return true if key exist in blockchain wallet repository", () => {
            walletRepositoryBlockchain.findByAddress("address");

            expect(walletRepositoryBlockchain.has("address")).toBeTrue();
            expect(walletRepositoryClone.has("address")).toBeTrue();
        });

        it("should return true if key exist in clone wallet repository", () => {
            walletRepositoryClone.findByAddress("address");

            expect(walletRepositoryBlockchain.has("address")).toBeFalse();
            expect(walletRepositoryClone.has("address")).toBeTrue();
        });

        it("should return false if key does not exist in clone wallet repository", () => {
            expect(walletRepositoryBlockchain.has("address")).toBeFalse();
            expect(walletRepositoryClone.has("address")).toBeFalse();
        });
    });

    describe("hasByAddress", () => {
        it("should return true if wallet exist in blockchain wallet repository", () => {
            walletRepositoryBlockchain.findByAddress("address");

            expect(walletRepositoryBlockchain.hasByAddress("address")).toBeTrue();
            expect(walletRepositoryClone.hasByAddress("address")).toBeTrue();
        });

        it("should return true if wallet exist in clone wallet repository", () => {
            walletRepositoryClone.findByAddress("address");

            expect(walletRepositoryBlockchain.hasByAddress("address")).toBeFalse();
            expect(walletRepositoryClone.hasByAddress("address")).toBeTrue();
        });

        it("should return false if wallet does not exist in clone wallet repository", () => {
            expect(walletRepositoryBlockchain.hasByAddress("address")).toBeFalse();
            expect(walletRepositoryClone.hasByAddress("address")).toBeFalse();
        });
    });

    describe("hasByPublicKey", () => {
        const publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";

        it("should return true if wallet exist in blockchain wallet repository", () => {
            walletRepositoryBlockchain.findByPublicKey(publicKey);

            expect(walletRepositoryBlockchain.hasByPublicKey(publicKey)).toBeTrue();
            expect(walletRepositoryClone.hasByPublicKey(publicKey)).toBeTrue();
        });

        it("should return true if wallet exist in clone wallet repository", () => {
            walletRepositoryClone.findByPublicKey(publicKey);

            expect(walletRepositoryBlockchain.hasByPublicKey(publicKey)).toBeFalse();
            expect(walletRepositoryClone.hasByPublicKey(publicKey)).toBeTrue();
        });

        it("should return false if wallet does not exist in clone wallet repository", () => {
            expect(walletRepositoryBlockchain.hasByPublicKey(publicKey)).toBeFalse();
            expect(walletRepositoryClone.hasByPublicKey(publicKey)).toBeFalse();
        });
    });

    describe("hasByUsername", () => {
        it("should return true if wallet exist in blockchain wallet repository", () => {
            const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");
            blockchainWallet.setAttribute("delegate.username", "genesis_1");
            walletRepositoryBlockchain.index(blockchainWallet);

            expect(walletRepositoryBlockchain.hasByUsername("genesis_1")).toBeTrue();
            expect(walletRepositoryClone.hasByUsername("genesis_1")).toBeTrue();
        });

        it("should return true if wallet exist in clone wallet repository", () => {
            const wallet = walletRepositoryClone.findByAddress("address");
            wallet.setAttribute("delegate.username", "genesis_1");
            walletRepositoryClone.index(wallet);

            expect(walletRepositoryBlockchain.hasByUsername("genesis_1")).toBeFalse();
            expect(walletRepositoryClone.hasByUsername("genesis_1")).toBeTrue();
        });

        it("should return false if wallet does not exist in clone wallet repository", () => {
            expect(walletRepositoryBlockchain.hasByUsername("genesis_1")).toBeFalse();
            expect(walletRepositoryClone.hasByUsername("genesis_1")).toBeFalse();
        });
    });

    describe("hasByIndex", () => {
        it("should return true if wallet exist in blockchain wallet repository", () => {
            const wallet = walletRepositoryBlockchain.findByAddress("address");
            wallet.setAttribute("delegate.username", "genesis_1");
            walletRepositoryBlockchain.index(wallet);

            expect(
                walletRepositoryBlockchain.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"),
            ).toBeTrue();
            expect(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1")).toBeTrue();
        });

        it("should return true if wallet exist in clone wallet repository", () => {
            const wallet = walletRepositoryClone.findByAddress("address");
            wallet.setAttribute("delegate.username", "genesis_1");
            walletRepositoryClone.index(wallet);

            expect(
                walletRepositoryBlockchain.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"),
            ).toBeFalse();
            expect(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1")).toBeTrue();
        });

        it("should return false if wallet does not exist in clone wallet repository", () => {
            expect(walletRepositoryBlockchain.hasByAddress("address")).toBeFalse();
            expect(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1")).toBeFalse();
        });

        it("should return false if index is forgotten", () => {
            const wallet = walletRepositoryClone.findByAddress("address");
            wallet.setAttribute("delegate.username", "genesis_1");
            walletRepositoryClone.index(wallet);

            expect(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1")).toBeTrue();

            wallet.forgetAttribute("delegate");
            walletRepositoryClone.index(wallet);

            expect(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1")).toBeFalse();
        });

        it("should return false if index is forgotten bu forgetOnIndex method", () => {
            const wallet = walletRepositoryClone.findByAddress("address");
            wallet.setAttribute("delegate.username", "genesis_1");
            walletRepositoryClone.index(wallet);

            expect(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1")).toBeTrue();

            walletRepositoryClone.forgetOnIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1");

            expect(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1")).toBeFalse();
        });

        it("should return false if index is forgotten, but still exist on blockchain wallet repository", () => {
            const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");
            blockchainWallet.setAttribute("delegate.username", "genesis_1");
            walletRepositoryBlockchain.index(blockchainWallet);

            const wallet = walletRepositoryClone.findByAddress("address");
            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Usernames).has("genesis_1")).toBeTrue();
            expect(wallet.hasAttribute("delegate.username")).toBeTrue();

            expect(
                walletRepositoryBlockchain.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"),
            ).toBeTrue();
            expect(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1")).toBeTrue();

            wallet.forgetAttribute("delegate");
            walletRepositoryClone.index(wallet);

            expect(
                walletRepositoryBlockchain.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1"),
            ).toBeTrue();
            expect(
                // @ts-ignore
                walletRepositoryClone.forgetIndexes[Contracts.State.WalletIndexes.Usernames].has("genesis_1"),
            ).toBeTrue();
            expect(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1")).toBeFalse();
        });

        it("should return false if index is forgotten and set again and still exist on blockchain wallet repository", () => {
            const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");
            blockchainWallet.setAttribute("delegate.username", "genesis_1");
            walletRepositoryBlockchain.index(blockchainWallet);

            const wallet = walletRepositoryClone.findByAddress("address");

            expect(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1")).toBeTrue();

            wallet.forgetAttribute("delegate");
            walletRepositoryClone.index(wallet);

            expect(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1")).toBeFalse();

            // Set same index again
            wallet.setAttribute("delegate.username", "genesis_1");
            walletRepositoryClone.index(wallet);

            expect(walletRepositoryClone.hasByIndex(Contracts.State.WalletIndexes.Usernames, "genesis_1")).toBeTrue();
        });
    });

    describe("getNonce", () => {
        const publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";

        it("should return 0 if wallet does not exists", () => {
            expect(walletRepositoryClone.getNonce(publicKey)).toEqual(Utils.BigNumber.ZERO);
        });

        it("should return nonce if wallet exists only in blockchain wallet repository", () => {
            const wallet = walletRepositoryBlockchain.findByPublicKey(publicKey);
            wallet.setNonce(Utils.BigNumber.make("10"));

            expect(walletRepositoryClone.getNonce(publicKey)).toEqual(Utils.BigNumber.make("10"));
            expect(
                walletRepositoryBlockchain.getIndex(Contracts.State.WalletIndexes.PublicKeys).has(publicKey),
            ).toBeTrue();
            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.PublicKeys).has(publicKey)).toBeFalse();
        });

        it("should return nonce if wallet exists on copy wallet repository", () => {
            const blockchainWallet = walletRepositoryBlockchain.findByPublicKey(publicKey);
            blockchainWallet.setNonce(Utils.BigNumber.make("10"));

            const wallet = walletRepositoryClone.findByPublicKey(publicKey);
            wallet.setNonce(Utils.BigNumber.make("20"));

            expect(walletRepositoryClone.getNonce(publicKey)).toEqual(Utils.BigNumber.make("20"));
            expect(
                walletRepositoryBlockchain.getIndex(Contracts.State.WalletIndexes.PublicKeys).has(publicKey),
            ).toBeTrue();
            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.PublicKeys).has(publicKey)).toBeTrue();
        });
    });

    describe("allByAddress", () => {
        it("should return all wallets from clone and blockchain wallet repository by address", () => {
            expect(walletRepositoryClone.allByAddress().length).toEqual(0);

            walletRepositoryClone.findByAddress("address_1");
            expect(walletRepositoryClone.allByAddress().length).toEqual(1);

            walletRepositoryBlockchain.findByAddress("address_2");
            expect(walletRepositoryClone.allByAddress().length).toEqual(2);
        });
    });

    describe("allByPublicKey", () => {
        it("should return all wallets from clone and blockchain wallet repository by public key", () => {
            expect(walletRepositoryClone.allByPublicKey().length).toEqual(0);

            walletRepositoryClone.findByPublicKey("03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37");
            expect(walletRepositoryClone.allByPublicKey().length).toEqual(1);

            walletRepositoryBlockchain.findByPublicKey(
                "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d",
            );
            expect(walletRepositoryClone.allByPublicKey().length).toEqual(2);

            walletRepositoryClone.findByAddress("address_1");
            walletRepositoryBlockchain.findByAddress("address_2");

            expect(walletRepositoryClone.allByPublicKey().length).toEqual(2);
        });
    });

    describe("allByUsername", () => {
        it("should return all wallets from clone and blockchain wallet repository by username", () => {
            expect(walletRepositoryClone.allByUsername().length).toEqual(0);

            const wallet_1 = walletRepositoryClone.findByAddress("address_1");
            wallet_1.setAttribute("delegate.username", "genesis_1");
            walletRepositoryClone.index(wallet_1);
            expect(walletRepositoryClone.allByUsername().length).toEqual(1);

            const wallet_2 = walletRepositoryBlockchain.findByAddress("address_2");
            wallet_2.setAttribute("delegate.username", "genesis_2");
            walletRepositoryBlockchain.index(wallet_2);

            expect(walletRepositoryClone.allByUsername().length).toEqual(2);
        });

        it("should skip wallets when key is removed from index", () => {
            const wallet = walletRepositoryClone.findByAddress("address");
            wallet.setAttribute("delegate.username", "genesis_1");
            walletRepositoryClone.index(wallet);

            expect(walletRepositoryClone.allByUsername().length).toEqual(1);

            wallet.forgetAttribute("delegate");
            walletRepositoryClone.index(wallet);

            expect(walletRepositoryClone.allByUsername().length).toEqual(0);
        });

        it("should skip wallets when key is removed from index, but still exists on blockchain index", () => {
            const blockchainWallet = walletRepositoryBlockchain.findByAddress("address");
            blockchainWallet.setAttribute("delegate.username", "genesis_1");
            walletRepositoryBlockchain.index(blockchainWallet);

            expect(walletRepositoryClone.allByUsername().length).toEqual(1);

            const wallet = walletRepositoryClone.findByAddress("address");
            wallet.forgetAttribute("delegate");
            walletRepositoryClone.index(wallet);

            expect(walletRepositoryClone.allByUsername().length).toEqual(0);
            expect(walletRepositoryBlockchain.allByUsername().length).toEqual(1);
        });
    });

    describe("allByIndex", () => {
        it("should return all wallets from clone and blockchain wallet repository by address", () => {
            expect(walletRepositoryClone.allByIndex(Contracts.State.WalletIndexes.Ipfs).length).toEqual(0);

            const wallet1 = walletRepositoryClone.findByAddress("address_1");
            walletRepositoryClone.setOnIndex(Contracts.State.WalletIndexes.Ipfs, "ipfs_1", wallet1);

            expect(walletRepositoryClone.allByIndex(Contracts.State.WalletIndexes.Ipfs)).toEqual([wallet1]);

            const wallet2 = walletRepositoryBlockchain.findByAddress("address_2");
            walletRepositoryBlockchain.setOnIndex(Contracts.State.WalletIndexes.Ipfs, "ipfs_2", wallet2);

            expect(walletRepositoryClone.allByIndex(Contracts.State.WalletIndexes.Ipfs)).toEqual([wallet1, wallet2]);
        });
    });

    describe("reset", () => {
        it("should clear all indexes and forgetIndexes", () => {
            const wallet = walletRepositoryClone.findByAddress("address");
            wallet.setAttribute("delegate.username", "genesis_1");
            walletRepositoryClone.index(wallet);

            wallet.forgetAttribute("delegate");
            walletRepositoryClone.index(wallet);

            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).values().length).toBe(1);
            // @ts-ignore
            expect(walletRepositoryClone.forgetIndexes[Contracts.State.WalletIndexes.Usernames].values().length).toBe(
                1,
            );

            walletRepositoryClone.reset();

            expect(walletRepositoryClone.getIndex(Contracts.State.WalletIndexes.Addresses).values().length).toBe(0);
            // @ts-ignore
            expect(walletRepositoryClone.forgetIndexes[Contracts.State.WalletIndexes.Usernames].values().length).toBe(
                0,
            );
        });
    });

    describe("getForgetIndex", () => {
        it("should throw error if index is not found", () => {
            expect(() => {
                // @ts-ignore
                walletRepositoryClone.getForgetIndex("undefined");
            }).toThrowError(WalletIndexNotFoundError);
        });
    });
});
