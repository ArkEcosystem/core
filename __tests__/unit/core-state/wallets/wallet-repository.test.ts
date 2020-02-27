import "jest-extended";
import { Contracts } from "@arkecosystem/core-kernel";

import { WalletRepository, Wallet } from "@arkecosystem/core-state/src/wallets";
import { addressesIndexer, publicKeysIndexer, ipfsIndexer, locksIndexer, resignationsIndexer, usernamesIndexer } from "@arkecosystem/core-state/src/wallets/indexers/indexers";
import { setUp } from "../setup";
import { Utils } from "@arkecosystem/crypto";

let walletRepo: WalletRepository;

beforeAll(() => {
    const initialEnv = setUp();
    walletRepo = initialEnv.walletRepo;
});

describe("Wallet Repository", () => {

    beforeEach(() => {
        walletRepo.reset();
    });

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

    describe("search", () => {
        it("should throw if no wallet exists", () => {
            expect(() => walletRepo.findByScope(Contracts.State.SearchScope.Wallets, "1")).toThrowError(`Wallet 1 doesn't exist in indexes`);
            expect(() => walletRepo.findByScope(Contracts.State.SearchScope.Delegates, "1")).toThrowError(`Wallet 1 doesn't exist in indexes`);
        });

        // TODO: is this expected behaviour that you cannot search by these scopes
        it("should throw when looking up via bridgechain, business or locks scope", () => {
            expect(() => walletRepo.findByScope(Contracts.State.SearchScope.Bridgechains, "1")).toThrowError(`Unknown scope ${Contracts.State.SearchScope.Bridgechains}`);
            expect(() => walletRepo.findByScope(Contracts.State.SearchScope.Businesses, "1")).toThrowError(`Unknown scope ${Contracts.State.SearchScope.Businesses}`);
            expect(() => walletRepo.findByScope(Contracts.State.SearchScope.Locks, "1")).toThrowError(`Unknown scope ${Contracts.State.SearchScope.Locks}`);
        });

        it("should throw when looking up via an unknown search scope", () => {
            expect(() => walletRepo.findByScope("doesNotExist" as any, "1")).toThrowError(`Unknown scope doesNotExist`);
        });

        it("should retrieve existing wallet when searching Wallet Scope", () => {
            const wallet = walletRepo.createWallet("abcd");
            walletRepo.reindex(wallet);

            expect(() => walletRepo.findByScope(Contracts.State.SearchScope.Wallets, wallet.address)).not.toThrow();
            expect(walletRepo.findByScope(Contracts.State.SearchScope.Wallets, wallet.address)).toEqual(wallet);
        });

        it("should retrieve existing wallet when searching Delegate Scope", () => {
            const wallet = walletRepo.createWallet("abcd");
            walletRepo.reindex(wallet);

            expect(() => walletRepo.findByScope(Contracts.State.SearchScope.Delegates, wallet.address)).toThrowError(`Wallet abcd isn't delegate`);

            wallet.setAttribute("delegate", true);
            expect(walletRepo.findByScope(Contracts.State.SearchScope.Delegates, wallet.address)).toEqual(wallet);
        });
    });

    it("reindexing should keep indexers in sync", () => {
        const address = "ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp";
        const wallet = walletRepo.createWallet(address);
        const publicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
        wallet.publicKey = publicKey;

        expect(walletRepo.findByAddress(address)).not.toEqual(wallet);
        walletRepo.getIndex("publicKeys").set(publicKey, wallet);
        expect(walletRepo.findByPublicKey(publicKey).publicKey).toBeDefined();
        expect(walletRepo.findByPublicKey(publicKey)).toEqual(wallet);

        expect(walletRepo.findByAddress(address).publicKey).toBeUndefined();
        expect(walletRepo.findByAddress(address)).not.toEqual(wallet);

        walletRepo.reindex(wallet);

        expect(walletRepo.findByAddress(address).publicKey).toBe(publicKey);
        expect(walletRepo.findByAddress(address)).toEqual(wallet);
    });

    it("should get, set and forget wallets by address", () => {
        const address = "abcd";
        const wallet = walletRepo.createWallet(address);

        /**
         * TODO: check this is desired behaviour
         * after creation a wallet is unknown to indexers (until reindex() is called)
         */
        expect(walletRepo.has(address)).toBeFalse();

        /**
         * TODO: check this is desired behaviour
         * findByAddress and findByPublicKey have the effect of reindexing (so the previous check now passes)
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

        walletRepo.forgetByAddress(address);
        expect(walletRepo.has(address)).toBeFalse();
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
        expect(walletRepo.hasByAddress('iDontExist')).toBeTrue();
        /**
         * TODO: check this is desired behaviour
         * Looking up a non-existing address by findByAddress creates a wallet.
         * However looking up a non-existing address using findByIndex() does not.
         */
        const errorMessage = "Wallet iAlsoDontExist doesn't exist in index addresses";
        expect(() => walletRepo.findByIndex("addresses", "iAlsoDontExist")).toThrow(errorMessage);
    });

    it("should get, set and forget wallets by public key", () => {
        const wallet = walletRepo.createWallet("abcde")
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

        walletRepo.forgetByPublicKey(publicKey);
        expect(walletRepo.has(publicKey)).toBeFalse();
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

    it("should get, set and forget wallets by username", () => {
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
        
        walletRepo.forgetByUsername(username);
        expect(walletRepo.has(username)).toBeFalse();
    });

    it("should be able to reindex forgotten wallets", () => {
        const wallet1 = walletRepo.createWallet("wallet1");
        walletRepo.reindex(wallet1);
        expect(walletRepo.has("wallet1")).toBeTrue();
        walletRepo.forgetByIndex("addresses", "wallet1");
        walletRepo.reindex(wallet1);
        expect(walletRepo.has("wallet1")).toBeTrue();
    });

    it("should index array of wallets and forget using different indexers", () => {
        const wallets: Contracts.State.Wallet[] = [];
        const walletAddresses: string[] = [];
        for (let i = 0; i < 6; i++) {
            const walletAddress = `wallet${i}`;
            walletAddresses.push(walletAddress);
            const wallet = walletRepo.createWallet(walletAddress)
            wallets.push(wallet);
        }

        walletRepo.index(wallets);
        walletAddresses.forEach(address => expect(walletRepo.has(address)).toBeTrue());

        const publicKey = "22337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";

        walletRepo.getIndex("publicKeys").set(publicKey, wallets[1]);
        walletRepo.getIndex("usernames").set("username", wallets[2]);
        walletRepo.getIndex("resignations").set("resign", wallets[3]);
        walletRepo.getIndex("locks").set("lock", wallets[4]);
        walletRepo.getIndex("ipfs").set("ipfs", wallets[5]);

        wallets.forEach(wallet => walletRepo.reindex(wallet));

        walletRepo.forgetByIndex("addresses", walletAddresses[0]);
        walletRepo.forgetByIndex("publicKeys", publicKey);
        walletRepo.forgetByIndex("usernames", "username");
        walletRepo.forgetByIndex("resignations", "resign");
        walletRepo.forgetByIndex("locks", "locks");
        walletRepo.forgetByIndex("ipfs", "ipfs");

        walletAddresses.forEach(address => expect(walletRepo.has(address)).toBeFalse())
    });

    it("should get the nonce of a wallet", () => {
        const wallet1 = walletRepo.createWallet("wallet1");
        wallet1.nonce = Utils.BigNumber.make(100);
        wallet1.publicKey = "22337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";
        walletRepo.reindex(wallet1);

        expect(walletRepo.getNonce(wallet1.publicKey)).toEqual(Utils.BigNumber.make(100));
    });

    it("should return 0 nonce if there is no wallet", () => {
        const publicKey = "22337416a26d8d49ec27059bd0589c49bb474029c3627715380f4df83fb431aece";
        expect(walletRepo.getNonce(publicKey)).toEqual(Utils.BigNumber.ZERO);
    });

    // TODO: pull this error out into specific error class/type
    it("should throw when looking up a username which doesn't exist", () => {
        expect(() => walletRepo.findByUsername("iDontExist")).toThrowError("Wallet iDontExist doesn't exist in index usernames");
        expect(() => walletRepo.findByIndex("usernames", "iDontExist")).toThrowError("Wallet iDontExist doesn't exist in index usernames");
    });
});