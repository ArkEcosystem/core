import "jest-extended";
import { Contracts } from "@arkecosystem/core-kernel";

import { WalletRepository, Wallet } from "@arkecosystem/core-state/src/wallets";
import { addressesIndexer, publicKeysIndexer, ipfsIndexer, locksIndexer, resignationsIndexer, usernamesIndexer } from "@arkecosystem/core-state/src/wallets/indexers/indexers";
import { setUp } from "../setup";

let walletRepoInstance: WalletRepository;

beforeAll(() => {
    const { walletRepo } = setUp();
    walletRepoInstance = walletRepo;
});

beforeEach(() => {
    walletRepoInstance.reset();
});

describe("Wallet Repository", () => {
    it("should create a wallet", () => {
        const wallet = walletRepoInstance.createWallet("abcd");
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
        expect(walletRepoInstance.getIndexNames()).toEqual(expected);
        expect(walletRepoInstance.getIndex("addresses").indexer).toEqual(addressesIndexer);
        expect(walletRepoInstance.getIndex("publicKeys").indexer).toEqual(publicKeysIndexer);
        expect(walletRepoInstance.getIndex("usernames").indexer).toEqual(usernamesIndexer);
        expect(walletRepoInstance.getIndex("resignations").indexer).toEqual(resignationsIndexer);
        expect(walletRepoInstance.getIndex("locks").indexer).toEqual(locksIndexer);
        expect(walletRepoInstance.getIndex("ipfs").indexer).toEqual(ipfsIndexer);
    });

    describe("search", () => {
        it("should throw if no wallet exists", () => {
            expect(() => walletRepoInstance.findByScope(Contracts.State.SearchScope.Wallets, "1")).toThrowError(`Wallet 1 doesn't exist in indexes`);
            expect(() => walletRepoInstance.findByScope(Contracts.State.SearchScope.Delegates, "1")).toThrowError(`Wallet 1 doesn't exist in indexes`);
        });

        // TODO: is this expected behaviour that you cannot search by these scopes
        it("should throw when looking up via bridgechain, business or locks scope", () => {
            expect(() => walletRepoInstance.findByScope(Contracts.State.SearchScope.Bridgechains, "1")).toThrowError(`Unknown scope ${Contracts.State.SearchScope.Bridgechains}`);
            expect(() => walletRepoInstance.findByScope(Contracts.State.SearchScope.Businesses, "1")).toThrowError(`Unknown scope ${Contracts.State.SearchScope.Businesses}`);
            expect(() => walletRepoInstance.findByScope(Contracts.State.SearchScope.Locks, "1")).toThrowError(`Unknown scope ${Contracts.State.SearchScope.Locks}`);
        });

        it("should throw when looking up via an unknown search scope", () => {
            expect(() => walletRepoInstance.findByScope("doesNotExist" as any, "1")).toThrowError(`Unknown scope doesNotExist`);
        });

        it("should retrieve existing wallet when searching Wallet Scope", () => {
            const wallet = walletRepoInstance.createWallet("abcd");
            walletRepoInstance.reindex(wallet);

            expect(() => walletRepoInstance.findByScope(Contracts.State.SearchScope.Wallets, wallet.address)).not.toThrow();
            expect(walletRepoInstance.findByScope(Contracts.State.SearchScope.Wallets, wallet.address)).toEqual(wallet);
        });

        it("should retrieve existing wallet when searching Delegate Scope", () => {
            const wallet = walletRepoInstance.createWallet("abcd");
            walletRepoInstance.reindex(wallet);

            expect(() => walletRepoInstance.findByScope(Contracts.State.SearchScope.Delegates, wallet.address)).toThrowError(`Wallet abcd isn't delegate`);

            wallet.setAttribute("delegate", true);
            expect(walletRepoInstance.findByScope(Contracts.State.SearchScope.Delegates, wallet.address)).toEqual(wallet);
        });
    });

    it("reindexing should keep indexers in sync", () => {
        const address = "ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp";
        const wallet = walletRepoInstance.createWallet(address);
        const publicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
        wallet.publicKey = publicKey;

        expect(walletRepoInstance.findByAddress(address)).not.toEqual(wallet);
        walletRepoInstance.getIndex("publicKeys").set(publicKey, wallet);
        expect(walletRepoInstance.findByPublicKey(publicKey).publicKey).toBeDefined();
        expect(walletRepoInstance.findByPublicKey(publicKey)).toEqual(wallet);

        expect(walletRepoInstance.findByAddress(address).publicKey).toBeUndefined();
        expect(walletRepoInstance.findByAddress(address)).not.toEqual(wallet);

        walletRepoInstance.reindex(wallet);

        expect(walletRepoInstance.findByAddress(address).publicKey).toBe(publicKey);
        expect(walletRepoInstance.findByAddress(address)).toEqual(wallet);
    });

    it("should get, set and forget wallets by address", () => {
        const address = "abcd";
        const wallet = walletRepoInstance.createWallet(address);

        /**
         * TODO: check this is desired behaviour
         * after creation a wallet is unknown to indexers (until reindex() is called)
         */
        expect(walletRepoInstance.has(address)).toBeFalse();

        /**
         * TODO: check this is desired behaviour
         * findByAddress and findByPublicKey have the effect of reindexing (so the previous check now passes)
         * findByUsername does not have this side-effect, so they should probably have different names.
         */
        expect(walletRepoInstance.findByAddress(address)).toEqual(wallet);
        expect(walletRepoInstance.has(address)).toBeTrue();

        expect(walletRepoInstance.findByIndex("addresses", address)).toEqual(wallet);        
        const nonExistingAddress = "abcde";
        expect(walletRepoInstance.has(address)).toBeTrue();
        expect(walletRepoInstance.has(nonExistingAddress)).toBeFalse();
        expect(walletRepoInstance.hasByAddress(address)).toBeTrue();
        expect(walletRepoInstance.hasByAddress(nonExistingAddress)).toBeFalse();
        expect(walletRepoInstance.hasByIndex("addresses", address)).toBeTrue();
        expect(walletRepoInstance.hasByIndex("addresses", nonExistingAddress)).toBeFalse();
        expect(walletRepoInstance.allByAddress()).toEqual([wallet]);

        walletRepoInstance.forgetByAddress(address);
        expect(walletRepoInstance.has(address)).toBeFalse();
    });

    /**
     * TODO: Check this is desired behaviour.
     * findByUsername (and corresponding findByIndex/findByIndexes) methods throw if it doesn't exist, 
     * where as findByAddress and findByPublicKey can be used for wallet creation.
     */
    it("should create a wallet if one is not found during address lookup", () => {
        expect(() => walletRepoInstance.findByAddress("hello")).not.toThrow();
        expect(walletRepoInstance.findByAddress("iDontExist")).toBeInstanceOf(Wallet);
        expect(walletRepoInstance.has("hello")).toBeTrue();
        expect(walletRepoInstance.hasByAddress('iDontExist')).toBeTrue();
        /**
         * TODO: check this is desired behaviour
         * Looking up a non-existing address by findByAddress creates a wallet.
         * However looking up a non-existing address using findByIndex() does not.
         */
        const errorMessage = "Wallet iAlsoDontExist doesn't exist in index addresses";
        expect(() => walletRepoInstance.findByIndex("addresses", "iAlsoDontExist")).toThrow(errorMessage);
    });

    it("should get, set and forget wallets by public key", () => {
        const wallet = walletRepoInstance.createWallet("abcde")
        const publicKey = "02337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";
        walletRepoInstance.getIndex("publicKeys").set(publicKey, wallet);
        expect(walletRepoInstance.findByPublicKey(publicKey)).toEqual(wallet);
        expect(walletRepoInstance.findByIndex("publicKeys", publicKey)).toEqual(wallet);
        
        const nonExistingPublicKey = "98727416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";

        expect(walletRepoInstance.has(publicKey)).toBeTrue();
        expect(walletRepoInstance.has(nonExistingPublicKey)).toBeFalse();
        expect(walletRepoInstance.hasByPublicKey(publicKey)).toBeTrue();
        expect(walletRepoInstance.hasByPublicKey(nonExistingPublicKey)).toBeFalse();
        expect(walletRepoInstance.hasByIndex("publicKeys", publicKey)).toBeTrue();
        expect(walletRepoInstance.hasByIndex("publicKeys", nonExistingPublicKey)).toBeFalse();
        expect(walletRepoInstance.allByPublicKey()).toEqual([wallet]);

        walletRepoInstance.forgetByPublicKey(publicKey);
        expect(walletRepoInstance.has(publicKey)).toBeFalse();
    });

    it("should create a wallet if one is not found during public key lookup", () => {
        const firstNotYetExistingPublicKey = "22337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";
        expect(() => walletRepoInstance.findByPublicKey(firstNotYetExistingPublicKey)).not.toThrow();
        expect(walletRepoInstance.findByPublicKey(firstNotYetExistingPublicKey)).toBeInstanceOf(Wallet);

        /**
         * TODO: check this is desired behaviour
         * Looking up a non-existing publicKey by findByPublicKey creates a wallet.
         * However looking up a non-existing publicKey using findByIndex() does not.
         */
        const secondNotYetExistingPublicKey = "32337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";
        expect(() => walletRepoInstance.findByIndex("publicKeys", secondNotYetExistingPublicKey)).toThrow();
    });

    it("should get, set and forget wallets by username", () => {
        const username = "testUsername";
        const wallet = walletRepoInstance.createWallet("abcdef");
        /**
         * TODO: check this is desired behaviour 
         * A username hasn't been set on the wallet here, it's been set on the indexer.
         * It means it's possible to look up a wallet by a username which is set on the WalletIndex and not the Wallet itself - this should probably throw. 
         */
        walletRepoInstance.getIndex("usernames").set(username, wallet);
        expect(walletRepoInstance.findByUsername(username)).toEqual(wallet);
        expect(walletRepoInstance.findByIndex("usernames", username)).toEqual(wallet);

        const nonExistingUsername = "iDontExistAgain";
        expect(walletRepoInstance.has(username)).toBeTrue();
        expect(walletRepoInstance.has(nonExistingUsername)).toBeFalse();
        expect(walletRepoInstance.hasByUsername(username)).toBeTrue();
        expect(walletRepoInstance.hasByUsername(nonExistingUsername)).toBeFalse();
        expect(walletRepoInstance.hasByIndex("usernames", username)).toBeTrue();
        expect(walletRepoInstance.hasByIndex("usernames", nonExistingUsername)).toBeFalse();
        expect(walletRepoInstance.allByUsername()).toEqual([wallet]);
        
        walletRepoInstance.forgetByUsername(username);
        expect(walletRepoInstance.has(username)).toBeFalse();
    });

    it("should be able to reindex forgotten wallets", () => {
        const wallet1 = walletRepoInstance.createWallet("wallet1");
        walletRepoInstance.reindex(wallet1);
        expect(walletRepoInstance.has("wallet1")).toBeTrue();
        walletRepoInstance.forgetByIndex("addresses", "wallet1");
        walletRepoInstance.reindex(wallet1);
        // TODO: is this desired behaviour?
        expect(walletRepoInstance.has("wallet1")).toBeTrue();
    });

    it("should index array of wallets and forget using different indexers", () => {
        const wallets: Contracts.State.Wallet[] = [];
        const walletAddresses: string[] = [];
        for (let i = 0; i < 6; i++) {
            const walletAddress = `wallet${i}`;
            walletAddresses.push(walletAddress);
            const wallet = walletRepoInstance.createWallet(walletAddress)
            wallets.push(wallet);
        }

        walletRepoInstance.index(wallets);
        walletAddresses.forEach(address => expect(walletRepoInstance.has(address)).toBeTrue());

        const publicKey = "22337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";

        walletRepoInstance.getIndex("publicKeys").set(publicKey, wallets[1]);
        walletRepoInstance.getIndex("usernames").set("username", wallets[2]);
        walletRepoInstance.getIndex("resignations").set("resign", wallets[3]);
        walletRepoInstance.getIndex("locks").set("lock", wallets[4]);
        walletRepoInstance.getIndex("ipfs").set("ipfs", wallets[5]);

        wallets.forEach(wallet => walletRepoInstance.reindex(wallet));

        walletRepoInstance.forgetByIndex("addresses", walletAddresses[0]);
        walletRepoInstance.forgetByIndex("publicKeys", publicKey);
        walletRepoInstance.forgetByIndex("usernames", "username");
        walletRepoInstance.forgetByIndex("resignations", "resign");
        walletRepoInstance.forgetByIndex("locks", "locks");
        walletRepoInstance.forgetByIndex("ipfs", "ipfs");

        walletAddresses.forEach(address => expect(walletRepoInstance.has(address)).toBeFalse())
    });

    // TODO: pull this error out into specific error class/type
    it("should throw when looking up a username which doesn't exist", () => {
        expect(() => walletRepoInstance.findByUsername("iDontExist")).toThrowError("Wallet iDontExist doesn't exist in index usernames");
        expect(() => walletRepoInstance.findByIndex("usernames", "iDontExist")).toThrowError("Wallet iDontExist doesn't exist in index usernames");
    });
});