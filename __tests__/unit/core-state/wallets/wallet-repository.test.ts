import "jest-extended";
import { Container, Providers, Services } from "@arkecosystem/core-kernel";
import { Sandbox } from "@packages/core-test-framework/src";

import { Managers } from "@arkecosystem/crypto";
import { defaults } from "../../../../packages/core-state/src/defaults";
import { StateStore } from "../../../../packages/core-state/src/stores/state";
import { WalletRepository, Wallet } from "@arkecosystem/core-state/src/wallets";
import { registerIndexers, registerFactories } from "../../../../packages/core-state/src/wallets/indexers";
import { addressesIndexer, publicKeysIndexer, ipfsIndexer, locksIndexer, resignationsIndexer, usernamesIndexer } from "@arkecosystem/core-state/src/wallets/indexers/indexers";

let sandbox: Sandbox;
let walletRepo: WalletRepository;

beforeAll(() => {
    sandbox = new Sandbox();

    sandbox.app
        .bind(Container.Identifiers.WalletAttributes)
        .to(Services.Attributes.AttributeSet);

    registerIndexers(sandbox.app);
    registerFactories(sandbox.app);

    sandbox.app
        .bind(Container.Identifiers.PluginConfiguration)
        .to(Providers.PluginConfiguration)
        .inSingletonScope();

    sandbox.app
        .get<any>(Container.Identifiers.PluginConfiguration)
        .set("storage.maxLastBlocks", defaults.storage.maxLastBlocks);

    sandbox.app
        .get<any>(Container.Identifiers.PluginConfiguration)
        .set("storage.maxLastTransactionIds", defaults.storage.maxLastTransactionIds);

    sandbox.app
        .bind(Container.Identifiers.StateStore)
        .to(StateStore)
        .inSingletonScope();
    
    sandbox.app
        .bind(Container.Identifiers.WalletRepository)
        .to(WalletRepository);

    walletRepo = sandbox.app
        .get(Container.Identifiers.WalletRepository);

    Managers.configManager.setFromPreset("testnet");
});

beforeEach(() => {
    walletRepo.reset();
});

describe("Wallet Repository", () => {
    it("should create a wallet", () => {
        const wallet = walletRepo.createWallet("abcd");
        expect(wallet.address).toEqual("abcd");
        expect(wallet).toBeInstanceOf(Wallet);
    });

    it("should be able to look up indexers", () => {
        const expected = [
            'addresses',
            'publicKeys',
            'usernames',
            'resignations',
            'locks',
            'ipfs'
        ];
        expect(walletRepo.getIndexNames()).toEqual(expected);
        expect(walletRepo.getIndex("addresses").indexer).toEqual(addressesIndexer);
        expect(walletRepo.getIndex("publicKeys").indexer).toEqual(publicKeysIndexer);
        expect(walletRepo.getIndex("usernames").indexer).toEqual(usernamesIndexer);
        expect(walletRepo.getIndex("resignations").indexer).toEqual(resignationsIndexer);
        expect(walletRepo.getIndex("locks").indexer).toEqual(locksIndexer);
        expect(walletRepo.getIndex("ipfs").indexer).toEqual(ipfsIndexer);
    });

    it("should have to use the correct indexer to interact with and update wallet", () => {
        const wallet = walletRepo.createWallet("abcd");
        const publicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
        wallet.publicKey = publicKey;
        
        expect(walletRepo.findByAddress("abcd").address).toEqual(wallet.address);
        expect(walletRepo.findByAddress("abcd").publicKey).toBeUndefined();

        expect(walletRepo.findByAddress("abcd")).not.toEqual(wallet);
        expect(walletRepo.findByPublicKey(publicKey)).not.toEqual(wallet);

        walletRepo.getIndex("publicKeys").set(publicKey, wallet);
        expect(walletRepo.findByPublicKey(publicKey).publicKey).toBeDefined();
        expect(walletRepo.findByPublicKey(publicKey)).toEqual(wallet);

        /**
         * TODO: Is this desired behaviour?
         * I would expect that searching by address, we should be able to retrieve a wallet 
         * with a publicKey which has already been updated/set. Currently each indexer (e.g publicKeyIndexer, 
         * addressIndexer) does not share the same instance of a WalletIndex. This has the effect that if a publicKey is set on the publicKeyIndexer, if we then look up the same wallet by Address (using the addressIndexer), the publicKey does not appear on that wallet.
         * 
         */
        expect(walletRepo.findByAddress("abcd").publicKey).toBeUndefined();
        expect(walletRepo.findByAddress("abcd")).not.toEqual(wallet);
    });

    it("should get wallets by address", () => {
        const wallet = walletRepo.createWallet("abcd");
        expect(walletRepo.findByAddress("abcd")).toEqual(wallet);
        expect(walletRepo.findByIndex("addresses", "abcd")).toEqual(wallet);
    });

    /**
     * TODO: Check this is desired behaviour.
     * findByUsername (and corresponding findByIndex/findByIndexes) methods throw if it doesn't exist, 
     * where as findByAddress and findByPublicKey can be used for wallet creation.
     */
    it("should create a wallet if one is not found during address lookup", () => {
        expect(() => walletRepo.findByAddress("hello")).not.toThrow();
        expect(walletRepo.findByAddress("iDontExist")).toBeInstanceOf(Wallet);

        /**
         * TODO: check this is desired behaviour
         * Looking up a non-existing address by findByAddress creates a wallet.
         * However looking up a non-existing address using findByIndex() does not.
         */
        const errorMessage = "Wallet iAlsoDontExist doesn't exist in index addresses";
        expect(() => walletRepo.findByIndex("addresses", "iAlsoDontExist")).toThrow(errorMessage);
    });

    it("should get wallets by public key", () => {
        const wallet = walletRepo.createWallet("abcde")
        const publicKey = "02337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";
        walletRepo.getIndex("publicKeys").set(publicKey, wallet);
        expect(walletRepo.findByPublicKey(publicKey)).toEqual(wallet);
        expect(walletRepo.findByIndex("publicKeys", publicKey)).toEqual(wallet);
    });


    it("should create a wallet if one is not found during public key lookup", () => {
        const firstNotYetExistingPublicKey = "22337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";
        expect(() => walletRepo.findByPublicKey(firstNotYetExistingPublicKey)).not.toThrow();
        expect(walletRepo.findByPublicKey(firstNotYetExistingPublicKey)).toBeInstanceOf(Wallet);

        /**
         * TODO: check this is desired behaviour
         * Looking up a non-existing publicKey by findByPublicKey creates a wallet.
         * However looking up a non-existing publicKey using findByIndex() does not.
         */
        const secondNotYetExistingPublicKey = "32337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";
        expect(() => walletRepo.findByIndex("publicKeys", secondNotYetExistingPublicKey)).toThrow();
    });

    it("should get wallets by username", () => {
        const wallet = walletRepo.createWallet("abcdef")
        walletRepo.getIndex("usernames").set("testUsername", wallet);
        expect(walletRepo.findByUsername("testUsername")).toEqual(wallet);
        expect(walletRepo.findByIndex("usernames", "testUsername")).toEqual(wallet);
    });

    // TODO: pull this error out into specific error class/type
    it("should throw when looking up a username which doesn't exist", () => {
        expect(() => walletRepo.findByUsername("iDontExist")).toThrowError("Wallet iDontExist doesn't exist in index usernames");
        expect(() => walletRepo.findByIndex("usernames", "iDontExist")).toThrowError("Wallet iDontExist doesn't exist in index usernames");
    });
});