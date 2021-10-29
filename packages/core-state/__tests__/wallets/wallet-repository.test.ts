/* eslint-disable jest/no-disabled-tests */
/* eslint-disable jest/expect-expect */
import "jest-extended";

import { Container, Contracts } from "@packages/core-kernel/src";
import {
    bridgechainIndexer,
    businessIndexer,
    MagistrateIndex,
} from "@packages/core-magistrate-transactions/src/wallet-indexes";
import { Wallet, WalletRepository } from "@packages/core-state/src/wallets";
import {
    addressesIndexer,
    ipfsIndexer,
    locksIndexer,
    publicKeysIndexer,
    resignationsIndexer,
    usernamesIndexer,
} from "@packages/core-state/src/wallets/indexers/indexers";
import { Utils } from "@packages/crypto/src";

import { setUp } from "../setup";

let walletRepo: WalletRepository;

beforeAll(async () => {
    const initialEnv = await setUp();

    initialEnv.sandbox.app
        .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
        .toConstantValue({
            name: MagistrateIndex.Businesses,
            indexer: businessIndexer,
            autoIndex: true,
        });

    initialEnv.sandbox.app
        .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
        .toConstantValue({
            name: MagistrateIndex.Bridgechains,
            indexer: bridgechainIndexer,
            autoIndex: true,
        });

    // TODO: why does this have to be rebound here?
    initialEnv.sandbox.app.rebind(Container.Identifiers.WalletRepository).to(WalletRepository);
    walletRepo = initialEnv.sandbox.app.getTagged(Container.Identifiers.WalletRepository, "state", "blockchain");
});

beforeEach(() => {
    walletRepo.reset();
});

afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

describe("Wallet Repository", () => {
    it("should throw if indexers are already registered", () => {
        expect(() => walletRepo.initialize()).toThrow("The wallet index is already registered: addresses");
    });

    it("should create a wallet", () => {
        const wallet = walletRepo.createWallet("abcd");
        expect(wallet.getAddress()).toEqual("abcd");
        expect(wallet).toBeInstanceOf(Wallet);
    });

    it("should be able to look up indexers", () => {
        const expected = [
            "addresses",
            "publicKeys",
            "usernames",
            "resignations",
            "locks",
            "ipfs",
            "businesses",
            "bridgechains",
        ];
        expect(walletRepo.getIndexNames()).toEqual(expected);
        expect(walletRepo.getIndex("addresses").indexer).toEqual(addressesIndexer);
        expect(walletRepo.getIndex("publicKeys").indexer).toEqual(publicKeysIndexer);
        expect(walletRepo.getIndex("usernames").indexer).toEqual(usernamesIndexer);
        expect(walletRepo.getIndex("resignations").indexer).toEqual(resignationsIndexer);
        expect(walletRepo.getIndex("locks").indexer).toEqual(locksIndexer);
        expect(walletRepo.getIndex("ipfs").indexer).toEqual(ipfsIndexer);
        expect(() => walletRepo.getIndex("iDontExist")).toThrow();
    });

    it("indexing should keep indexers in sync", () => {
        const address = "ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp";
        const wallet = walletRepo.createWallet(address);
        const publicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
        wallet.setPublicKey(publicKey);

        expect(walletRepo.findByAddress(address)).not.toEqual(wallet);
        walletRepo.getIndex("publicKeys").set(publicKey, wallet);
        expect(walletRepo.findByPublicKey(publicKey).getPublicKey()).toBeDefined();
        expect(walletRepo.findByPublicKey(publicKey)).toEqual(wallet);

        expect(walletRepo.findByAddress(address).getPublicKey()).toBeUndefined();
        expect(walletRepo.findByAddress(address)).not.toEqual(wallet);

        walletRepo.index(wallet);

        expect(walletRepo.findByAddress(address).getPublicKey()).toBe(publicKey);
        expect(walletRepo.findByAddress(address)).toEqual(wallet);
    });

    it("should get and set wallets by address", () => {
        const address = "abcd";
        const wallet = walletRepo.createWallet(address);

        /**
         * TODO: check this is desired behaviour
         * after creation a wallet is unknown to indexers (until index() is called)
         */
        expect(walletRepo.has(address)).toBeFalse();

        /**
         * TODO: check this is desired behaviour
         * findByAddress and findByPublicKey have the effect of indexing (so the previous check now passes)
         * findByUsername does not have this side-effect, so they should probably have different names.
         */
        expect(walletRepo.findByAddress(address)).toEqual(wallet);
        expect(walletRepo.has(address)).toBeTrue();

        expect(walletRepo.findByIndex("addresses", address)).toEqual(wallet);
        const nonExistingAddress = "abcde";
        expect(walletRepo.has(address)).toBeTrue();
        expect(walletRepo.has(nonExistingAddress)).toBeFalse();
        expect(walletRepo.hasByAddress(address)).toBeTrue();
        expect(walletRepo.hasByAddress(nonExistingAddress)).toBeFalse();
        expect(walletRepo.hasByIndex("addresses", address)).toBeTrue();
        expect(walletRepo.hasByIndex("addresses", nonExistingAddress)).toBeFalse();
        expect(walletRepo.allByAddress()).toEqual([wallet]);
        expect(walletRepo.allByIndex("addresses")).toEqual([wallet]);
    });

    /**
     * TODO: Check this is desired behaviour.
     * findByUsername (and corresponding findByIndex/findByIndexes) methods throw if it doesn't exist,
     * where as findByAddress and findByPublicKey can be used for wallet creation.
     */
    it("should create a wallet if one is not found during address lookup", () => {
        expect(() => walletRepo.findByAddress("hello")).not.toThrow();
        expect(walletRepo.findByAddress("iDontExist")).toBeInstanceOf(Wallet);
        expect(walletRepo.has("hello")).toBeTrue();
        expect(walletRepo.hasByAddress("iDontExist")).toBeTrue();
        /**
         * TODO: check this is desired behaviour
         * Looking up a non-existing address by findByAddress creates a wallet.
         * However looking up a non-existing address using findByIndex() does not.
         */
        const errorMessage = "Wallet iAlsoDontExist doesn't exist in index addresses";
        expect(() => walletRepo.findByIndex("addresses", "iAlsoDontExist")).toThrow(errorMessage);
    });

    it("should get and set wallets by public key", () => {
        const wallet = walletRepo.createWallet("abcde");
        const publicKey = "02337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";
        walletRepo.getIndex("publicKeys").set(publicKey, wallet);
        expect(walletRepo.findByPublicKey(publicKey)).toEqual(wallet);
        expect(walletRepo.findByIndex("publicKeys", publicKey)).toEqual(wallet);

        const nonExistingPublicKey = "98727416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";

        expect(walletRepo.has(publicKey)).toBeTrue();
        expect(walletRepo.has(nonExistingPublicKey)).toBeFalse();
        expect(walletRepo.hasByPublicKey(publicKey)).toBeTrue();
        expect(walletRepo.hasByPublicKey(nonExistingPublicKey)).toBeFalse();
        expect(walletRepo.hasByIndex("publicKeys", publicKey)).toBeTrue();
        expect(walletRepo.hasByIndex("publicKeys", nonExistingPublicKey)).toBeFalse();
        expect(walletRepo.allByPublicKey()).toEqual([wallet]);
        expect(walletRepo.allByIndex("publicKeys")).toEqual([wallet]);
    });

    it("should create a wallet if one is not found during public key lookup", () => {
        const firstNotYetExistingPublicKey = "0235d486fea0193cbe77e955ab175b8f6eb9eaf784de689beffbd649989f5d6be3";
        expect(() => walletRepo.findByPublicKey(firstNotYetExistingPublicKey)).not.toThrow();
        expect(walletRepo.findByPublicKey(firstNotYetExistingPublicKey)).toBeInstanceOf(Wallet);

        /**
         * TODO: check this is desired behaviour
         * Looking up a non-existing publicKey by findByPublicKey creates a wallet.
         * However looking up a non-existing publicKey using findByIndex() does not.
         */
        const secondNotYetExistingPublicKey = "03a46f2547d20b47003c1c376788db5a54d67264df2ae914f70bf453b6a1fa1b3a";
        expect(() => walletRepo.findByIndex("publicKeys", secondNotYetExistingPublicKey)).toThrow();
    });

    it("should get and set wallets by username", () => {
        const username = "testUsername";
        const wallet = walletRepo.createWallet("abcdef");
        /**
         * TODO: check this is desired behaviour
         * A username hasn't been set on the wallet here, it's been set on the indexer.
         * It means it's possible to look up a wallet by a username which is set on the WalletIndex and not the Wallet itself - this should probably throw.
         */
        walletRepo.getIndex("usernames").set(username, wallet);
        expect(walletRepo.findByUsername(username)).toEqual(wallet);
        expect(walletRepo.findByIndex("usernames", username)).toEqual(wallet);

        const nonExistingUsername = "iDontExistAgain";
        expect(walletRepo.has(username)).toBeTrue();
        expect(walletRepo.has(nonExistingUsername)).toBeFalse();
        expect(walletRepo.hasByUsername(username)).toBeTrue();
        expect(walletRepo.hasByUsername(nonExistingUsername)).toBeFalse();
        expect(walletRepo.hasByIndex("usernames", username)).toBeTrue();
        expect(walletRepo.hasByIndex("usernames", nonExistingUsername)).toBeFalse();
        expect(walletRepo.allByUsername()).toEqual([wallet]);
        expect(walletRepo.allByIndex("usernames")).toEqual([wallet]);
    });

    it("should be able to index forgotten wallets", () => {
        const wallet1 = walletRepo.createWallet("wallet1");
        walletRepo.index(wallet1);
        expect(walletRepo.has("wallet1")).toBeTrue();
        walletRepo.index(wallet1);
        expect(walletRepo.has("wallet1")).toBeTrue();
    });

    it("should do nothing if forgotten wallet does not exist", () => {
        const wallet1 = walletRepo.createWallet("wallet1");
        walletRepo.index(wallet1);
        // @ts-ignore
        wallet1.publicKey = undefined;
        expect(walletRepo.has("wallet2")).toBeFalse();
    });

    it("should index array of wallets using different indexers", () => {
        const wallets: Contracts.State.Wallet[] = [];
        const walletAddresses: string[] = [];
        for (let i = 0; i < 6; i++) {
            const walletAddress = `wallet${i}`;
            walletAddresses.push(walletAddress);
            const wallet = walletRepo.createWallet(walletAddress);
            wallets.push(wallet);
        }

        for (const wallet of wallets) {
            walletRepo.index(wallet);
        }

        walletAddresses.forEach((address) => expect(walletRepo.has(address)).toBeTrue());

        const publicKey = "02511f16ffb7b7e9afc12f04f317a11d9644e4be9eb5a5f64673946ad0f6336f34";

        walletRepo.getIndex("publicKeys").set(publicKey, wallets[1]);
        walletRepo.getIndex("usernames").set("username", wallets[2]);
        walletRepo.getIndex("resignations").set("resign", wallets[3]);
        walletRepo.getIndex("locks").set("lock", wallets[4]);
        walletRepo.getIndex("ipfs").set("ipfs", wallets[5]);

        wallets.forEach((wallet) => walletRepo.index(wallet));

        walletAddresses.forEach((address) => expect(walletRepo.has(address)).toBeTrue());
    });

    it("should get the nonce of a wallet", () => {
        const wallet1 = walletRepo.createWallet("wallet1");
        wallet1.setNonce(Utils.BigNumber.make(100));
        wallet1.setPublicKey("02511f16ffb7b7e9afc12f04f317a11d9644e4be9eb5a5f64673946ad0f6336f34");
        walletRepo.index(wallet1);

        expect(walletRepo.getNonce(wallet1.getPublicKey()!)).toEqual(Utils.BigNumber.make(100));
    });

    it("should return 0 nonce if there is no wallet", () => {
        const publicKey = "03c075494ad044ab8c0b2dc7ccd19f649db844a4e558e539d3ac2610c4b90a5139";
        expect(walletRepo.getNonce(publicKey)).toEqual(Utils.BigNumber.ZERO);
    });

    it("should throw when looking up a username which doesn't exist", () => {
        expect(() => walletRepo.findByUsername("iDontExist")).toThrowError(
            "Wallet iDontExist doesn't exist in index usernames",
        );
        expect(() => walletRepo.findByIndex("usernames", "iDontExist")).toThrowError(
            "Wallet iDontExist doesn't exist in index usernames",
        );
    });

    describe("allByIndex", () => {
        it("should return values on index", () => {
            const wallet = walletRepo.findByAddress("address");

            expect(walletRepo.allByIndex("addresses")).toEqual([wallet]);
        });
    });

    describe("setOnIndex", () => {
        it("should set wallet on index", () => {
            const wallet = walletRepo.findByAddress("address");
            walletRepo.setOnIndex("addresses", "address2", wallet);

            expect(walletRepo.allByIndex("addresses")).toEqual([wallet, wallet]);
        });
    });

    describe("forgetOnIndex", () => {
        it("should forget wallet on index", () => {
            const wallet = walletRepo.findByAddress("address");
            expect(walletRepo.allByIndex("addresses")).toEqual([wallet]);

            walletRepo.forgetOnIndex("addresses", "address");

            expect(walletRepo.allByIndex("addresses")).toEqual([]);
        });
    });
});
