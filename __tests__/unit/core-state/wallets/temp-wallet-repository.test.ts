import "jest-extended";
import { Contracts } from "@arkecosystem/core-kernel";

import { Utils } from "@arkecosystem/crypto";
import { Wallet, TempWalletRepository, WalletRepository } from "@arkecosystem/core-state/src/wallets";
import { addressesIndexer, publicKeysIndexer, ipfsIndexer, locksIndexer, resignationsIndexer, usernamesIndexer } from "@arkecosystem/core-state/src/wallets/indexers/indexers";
import { setUp } from "../setup";

let tempWalletRepoInstance: TempWalletRepository;
let walletRepoInstance: WalletRepository;

beforeAll(() => {
    const { tempWalletRepo, walletRepo } = setUp();
    tempWalletRepoInstance = tempWalletRepo;
    walletRepoInstance = walletRepo;
});

beforeEach(() => {
    tempWalletRepoInstance.reset();
    walletRepoInstance.reset();
});

describe("Temp Wallet Repository", () => {
    it("should create a wallet", () => {
        const wallet = tempWalletRepoInstance.createWallet("abcd");
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
        expect(tempWalletRepoInstance.getIndexNames()).toEqual(expected);
        expect(tempWalletRepoInstance.getIndex("addresses").indexer).toEqual(addressesIndexer);
        expect(tempWalletRepoInstance.getIndex("publicKeys").indexer).toEqual(publicKeysIndexer);
        expect(tempWalletRepoInstance.getIndex("usernames").indexer).toEqual(usernamesIndexer);
        expect(tempWalletRepoInstance.getIndex("resignations").indexer).toEqual(resignationsIndexer);
        expect(tempWalletRepoInstance.getIndex("locks").indexer).toEqual(locksIndexer);
        expect(tempWalletRepoInstance.getIndex("ipfs").indexer).toEqual(ipfsIndexer);
    });

    describe("search", () => {
        it("should throw if no wallet exists", () => {
            expect(() => tempWalletRepoInstance.findByScope(Contracts.State.SearchScope.Wallets, "1")).toThrowError(`Wallet 1 doesn't exist in indexes`);
            expect(() => tempWalletRepoInstance.findByScope(Contracts.State.SearchScope.Delegates, "1")).toThrowError(`Wallet 1 doesn't exist in indexes`);
        });

        // TODO: is this expected behaviour that you cannot search by these scopes
        it("should throw when looking up via bridgechain, business or locks scope", () => {
            expect(() => tempWalletRepoInstance.findByScope(Contracts.State.SearchScope.Bridgechains, "1")).toThrowError(`Unknown scope ${Contracts.State.SearchScope.Bridgechains}`);
            expect(() => tempWalletRepoInstance.findByScope(Contracts.State.SearchScope.Businesses, "1")).toThrowError(`Unknown scope ${Contracts.State.SearchScope.Businesses}`);
            expect(() => tempWalletRepoInstance.findByScope(Contracts.State.SearchScope.Locks, "1")).toThrowError(`Unknown scope ${Contracts.State.SearchScope.Locks}`);
        });

        it("should throw when looking up via an unknown search scope", () => {
            expect(() => tempWalletRepoInstance.findByScope("doesNotExist" as any, "1")).toThrowError(`Unknown scope doesNotExist`);
        });

        it("should have to reindex wallet on original repo in order to search", () => {
            const wallet = tempWalletRepoInstance.createWallet("abcd");
            expect(() => tempWalletRepoInstance.findByScope(Contracts.State.SearchScope.Wallets, wallet.address)).toThrow();

            walletRepoInstance.reindex(wallet);

            expect(() => tempWalletRepoInstance.findByScope(Contracts.State.SearchScope.Wallets, wallet.address)).not.toThrow();
            expect(tempWalletRepoInstance.findByScope(Contracts.State.SearchScope.Wallets, wallet.address)).toEqual(wallet);
        });

        it("should retrieve existing wallet when searching Delegate Scope", () => {
            const wallet = tempWalletRepoInstance.createWallet("abcd");
            walletRepoInstance.reindex(wallet);

            expect(() => tempWalletRepoInstance.findByScope(Contracts.State.SearchScope.Delegates, wallet.address)).toThrowError(`Wallet abcd isn't delegate`);

            wallet.setAttribute("delegate", true);
            /**
             * TODO: check that TemptempWalletRepo should throw here.
             * WalletRepo does not.
             */
            expect(() => tempWalletRepoInstance.findByScope(Contracts.State.SearchScope.Delegates, wallet.address)).toThrowError(`Wallet abcd isn't delegate`);
        });
    });
    
    it("findByPublicKey should reindex", () => {
        const address = "ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp";
        const wallet = tempWalletRepoInstance.createWallet(address);
        const publicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
        wallet.publicKey = publicKey;

        expect(tempWalletRepoInstance.findByAddress(address)).not.toEqual(wallet);
        tempWalletRepoInstance.getIndex("publicKeys").set(publicKey, wallet);
        expect(tempWalletRepoInstance.findByPublicKey(publicKey).publicKey).toBeDefined();
        expect(tempWalletRepoInstance.findByPublicKey(publicKey)).toEqual(wallet);

        /**
         * TODO: check this is desired behaviour?
         * TempWalletRepository calls reindex inside findByPublicKey (unlike WalletRepository).
         * This has the effect that these are now defined without needing to reindex
         */
        expect(tempWalletRepoInstance.findByAddress(address).publicKey).toBeDefined();
        expect(tempWalletRepoInstance.findByAddress(address)).toEqual(wallet);
    });

    it("should not retrieve wallets indexed in original repo, until they are indexed", () => {
        const address = "abcd";

        const wallet = tempWalletRepoInstance.createWallet(address);
        tempWalletRepoInstance.reindex(wallet);
    
        /**
         * TODO: check this is desired behaviour
         * has, hasByAddress and hasByIndex all behave differently because of the problem of inheritance.
         * I've added has and hasByIndex to TempWalletRepo to fix this (i.e. these should all return false, not just one of them), but in general this architecture needs revisiting.
         */
        expect(tempWalletRepoInstance.has(address)).toBeFalse();
        expect(tempWalletRepoInstance.hasByAddress(address)).toBeFalse();
        expect(tempWalletRepoInstance.hasByIndex("addresses", address)).toBeFalse();
        /**
         *  For example, because allByAddress is *not* overwritten in TempWalletRepo, this falls back to the WalletRepo base class which returns the wallet, despite hasByAddress being false.
         * 
         * We can add all these different methods to TempWalletRepository to make the class behave more sensibly. However, if these methods aren't intended to ever really be called on the temporary version of the wallet repository it makes sense to use a shared base interface, rather than using inheritance.
         * 
         * IMO inheritance should be used very sparingly, as it is often difficult to reason about, and calling methods have side effects the calling code may not expect.
         */
        expect(tempWalletRepoInstance.allByAddress()).toEqual([wallet]);

        walletRepoInstance.reindex(wallet);
            
        expect(tempWalletRepoInstance.has(address)).toBeTrue();
        expect(tempWalletRepoInstance.hasByAddress(address)).toBeTrue();
        expect(tempWalletRepoInstance.hasByIndex("addresses", address)).toBeTrue();
        expect(tempWalletRepoInstance.allByAddress()).toEqual([wallet]);

        // TODO: similarly, this behaviour is odd - as the code hasn't been overwritten in the extended class
        tempWalletRepoInstance.forgetByAddress(address);
        expect(tempWalletRepoInstance.has(address)).toBeTrue();
    });

    /**
     * TODO: check this is desired behaviour
     * 
     */
    it("should create a wallet if one is not found during address lookup", () => {
        expect(() => tempWalletRepoInstance.findByAddress("hello")).not.toThrow();
        expect(tempWalletRepoInstance.findByAddress("iDontExist")).toBeInstanceOf(Wallet);
        expect(tempWalletRepoInstance.has("hello")).toBeFalse();
        expect(tempWalletRepoInstance.hasByAddress('iDontExist')).toBeFalse();
       
        /**
         * TODO: check this is desired behaviour
         * WalletRepo throws here, TempWalletRepo does not.
         */
        expect(() => tempWalletRepoInstance.findByIndex("addresses", "iAlsoDontExist")).not.toThrow();
    });

    describe("reindex", () => {
        it("should not affect the original", () => {
            const wallet = walletRepoInstance.createWallet("abcdef");
            walletRepoInstance.reindex(wallet);

            tempWalletRepoInstance.reindex(wallet);

            expect(walletRepoInstance.findByAddress(wallet.address)).not.toBe(
                tempWalletRepoInstance.findByAddress(wallet.address),
            );
        });
    });

    describe("findByAddress", () => {
        it("should return a copy", () => {
            const wallet = walletRepoInstance.createWallet("abcdef");
            walletRepoInstance.reindex(wallet);

            const tempWallet = tempWalletRepoInstance.findByAddress(wallet.address);
            tempWallet.balance = Utils.BigNumber.ONE;

            expect(wallet.balance).not.toEqual(tempWallet.balance);
        });
    });

    describe("findByPublickey", () => {
        it("should return a copy", () => {
            const wallet = walletRepoInstance.createWallet("ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp");
            wallet.publicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
            wallet.balance = Utils.BigNumber.SATOSHI;
            walletRepoInstance.reindex(wallet);

            const tempWallet = tempWalletRepoInstance.findByPublicKey(wallet.publicKey);
            tempWallet.balance = Utils.BigNumber.ZERO;

            expect(wallet.balance).toEqual(Utils.BigNumber.SATOSHI);
            expect(tempWallet.balance).toEqual(Utils.BigNumber.ZERO);
        });
    });

    describe("findByUsername", () => {
        it("should return a copy", () => {
            const wallet = walletRepoInstance.createWallet("abcdef");
            wallet.setAttribute("delegate", { username: "test" });
            walletRepoInstance.reindex(wallet);

            const tempWallet = tempWalletRepoInstance.findByUsername(wallet.getAttribute("delegate.username"));
            tempWallet.balance = Utils.BigNumber.ONE;

            expect(wallet.balance).not.toEqual(tempWallet.balance);
        });
    });

    describe("hasByAddress", () => {
        it("should be ok", () => {
            const wallet = walletRepoInstance.createWallet("abcdef");
            walletRepoInstance.reindex(wallet);

            expect(tempWalletRepoInstance.hasByAddress(wallet.address)).toBeTrue();
        });
    });

    describe("hasByPublicKey", () => {
        it("should be ok", () => {
            const wallet = walletRepoInstance.createWallet("ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp");
            wallet.publicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
            walletRepoInstance.reindex(wallet);

            expect(tempWalletRepoInstance.hasByPublicKey(wallet.publicKey)).toBeTrue();
        });
    });

    describe("hasByUsername", () => {
        it("should be ok", () => {
            const wallet = walletRepoInstance.createWallet("abcdef");
            wallet.setAttribute("delegate", { username: "test" });
            walletRepoInstance.reindex(wallet);

            expect(tempWalletRepoInstance.hasByUsername(wallet.getAttribute("delegate.username"))).toBeTrue();
        });
    });
});