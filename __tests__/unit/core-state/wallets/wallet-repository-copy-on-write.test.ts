import "jest-extended";

import { Contracts } from "@packages/core-kernel";
import { Wallet, WalletRepository, WalletRepositoryCopyOnWrite } from "@packages/core-state/src/wallets";
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

let walletRepoCopyOnWrite: WalletRepositoryCopyOnWrite;
let walletRepo: WalletRepository;

beforeAll(async () => {
    const initialEnv = await setUp();
    walletRepoCopyOnWrite = initialEnv.walletRepoCopyOnWrite;
    walletRepo = initialEnv.walletRepo;
});

beforeEach(() => {
    walletRepoCopyOnWrite.reset();
    walletRepo.reset();
});

describe("Wallet Repository Copy On Write", () => {
    it("should create a wallet", () => {
        const wallet = walletRepoCopyOnWrite.createWallet("abcd");
        expect(wallet.address).toEqual("abcd");
        expect(wallet).toBeInstanceOf(Wallet);
    });

    it("should be able to look up indexers", () => {
        const expected = ["addresses", "publicKeys", "usernames", "resignations", "locks", "ipfs"];
        expect(walletRepoCopyOnWrite.getIndexNames()).toEqual(expected);
        expect(walletRepoCopyOnWrite.getIndex("addresses").indexer).toEqual(addressesIndexer);
        expect(walletRepoCopyOnWrite.getIndex("publicKeys").indexer).toEqual(publicKeysIndexer);
        expect(walletRepoCopyOnWrite.getIndex("usernames").indexer).toEqual(usernamesIndexer);
        expect(walletRepoCopyOnWrite.getIndex("resignations").indexer).toEqual(resignationsIndexer);
        expect(walletRepoCopyOnWrite.getIndex("locks").indexer).toEqual(locksIndexer);
        expect(walletRepoCopyOnWrite.getIndex("ipfs").indexer).toEqual(ipfsIndexer);
    });

    it("should find wallets by address", () => {
        const spyFindByAddress = jest.spyOn(walletRepo, "findByAddress");
        const clonedWallet = walletRepoCopyOnWrite.findByAddress("notexisting");
        expect(spyFindByAddress).toHaveBeenCalledWith("notexisting");
        const originalWallet = walletRepo.findByAddress(clonedWallet.address);
        expect(originalWallet).not.toBe(clonedWallet);
    });

    it("should get all by username", () => {
        const wallet1 = walletRepoCopyOnWrite.createWallet("abcd");
        const wallet2 = walletRepoCopyOnWrite.createWallet("efg");
        const wallet3 = walletRepoCopyOnWrite.createWallet("hij");

        wallet1.setAttribute("delegate.username", "username1");
        wallet2.setAttribute("delegate.username", "username2");
        wallet3.setAttribute("delegate.username", "username3");

        const allWallets = [wallet1, wallet2, wallet3];
        walletRepo.index(allWallets);

        expect(walletRepoCopyOnWrite.allByUsername()).toEqual(allWallets);

        const wallet4 = walletRepoCopyOnWrite.createWallet("klm");

        wallet4.setAttribute("delegate.username", "username4");
        walletRepo.index(wallet4);
        allWallets.push(wallet4);

        expect(walletRepoCopyOnWrite.allByUsername()).toEqual(allWallets);
    });

    describe("search", () => {
        it("should throw if no wallet exists", () => {
            expect(() => walletRepoCopyOnWrite.findByScope(Contracts.State.SearchScope.Wallets, "1")).toThrowError(
                `Wallet 1 doesn't exist in indexes`,
            );
            expect(() => walletRepoCopyOnWrite.findByScope(Contracts.State.SearchScope.Delegates, "1")).toThrowError(
                `Wallet 1 doesn't exist in indexes`,
            );
        });

        // TODO: is this expected behaviour that you cannot search by these scopes
        it("should throw when looking up via locks scope", () => {
            expect(() => walletRepoCopyOnWrite.findByScope(Contracts.State.SearchScope.Locks, "1")).toThrowError(
                `Unknown scope ${Contracts.State.SearchScope.Locks}`,
            );
        });

        it("should throw when looking up via an unknown search scope", () => {
            expect(() => walletRepoCopyOnWrite.findByScope("doesNotExist" as any, "1")).toThrowError(
                `Unknown scope doesNotExist`,
            );
        });

        it("should have to index wallet on original repo in order to search", () => {
            const wallet = walletRepoCopyOnWrite.createWallet("abcd");
            expect(() =>
                walletRepoCopyOnWrite.findByScope(Contracts.State.SearchScope.Wallets, wallet.address),
            ).toThrow();

            walletRepo.index(wallet);

            expect(() =>
                walletRepoCopyOnWrite.findByScope(Contracts.State.SearchScope.Wallets, wallet.address),
            ).not.toThrow();
            expect(walletRepoCopyOnWrite.findByScope(Contracts.State.SearchScope.Wallets, wallet.address)).toEqual(
                wallet,
            );
        });

        it("should retrieve existing wallet when searching Delegate Scope", () => {
            const wallet = walletRepoCopyOnWrite.createWallet("abcd");
            walletRepo.index(wallet);

            expect(() =>
                walletRepoCopyOnWrite.findByScope(Contracts.State.SearchScope.Delegates, wallet.address),
            ).toThrowError(`Wallet abcd isn't delegate`);

            wallet.setAttribute("delegate", true);
            /**
             * TODO: check that TemptempWalletRepo should throw here.
             * WalletRepo does not.
             */
            expect(() =>
                walletRepoCopyOnWrite.findByScope(Contracts.State.SearchScope.Delegates, wallet.address),
            ).toThrowError(`Wallet abcd isn't delegate`);
        });
    });

    // TODO: test behaves differently to WalletRepository due to inheritance
    it.skip("findByPublicKey should index wallet", () => {
        const address = "ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp";
        const wallet = walletRepoCopyOnWrite.createWallet(address);
        const publicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
        wallet.publicKey = publicKey;

        expect(walletRepoCopyOnWrite.findByAddress(address)).not.toEqual(wallet);
        walletRepoCopyOnWrite.getIndex("publicKeys").set(publicKey, wallet);
        expect(walletRepoCopyOnWrite.findByPublicKey(publicKey).publicKey).toBeDefined();
        expect(walletRepoCopyOnWrite.findByPublicKey(publicKey)).toEqual(wallet);

        /**
         * TODO: check this is desired behaviour?
         * TempWalletRepository calls index inside findByPublicKey (unlike WalletRepository).
         * This has the effect that these are now defined without needing to index
         */
        expect(walletRepoCopyOnWrite.findByAddress(address).publicKey).toBeDefined();
        expect(walletRepoCopyOnWrite.findByAddress(address)).toEqual(wallet);
    });

    // TODO: test behaves differently to WalletRepository due to inheritance
    it.skip("should not retrieve wallets indexed in original repo, until they are indexed", () => {
        const address = "abcd";

        const wallet = walletRepoCopyOnWrite.createWallet(address);
        walletRepoCopyOnWrite.index(wallet);

        /**
         * TODO: check this is desired behaviour
         * has, hasByAddress and hasByIndex all behave differently because of the problem of inheritance.
         * I've added has and hasByIndex to TempWalletRepo to fix this (i.e. these should all return false, not just one of them), but in general this architecture needs revisiting.
         */
        expect(walletRepoCopyOnWrite.has(address)).toBeFalse();
        expect(walletRepoCopyOnWrite.hasByAddress(address)).toBeFalse();
        expect(walletRepoCopyOnWrite.hasByIndex("addresses", address)).toBeFalse();
        /**
         *  For example, because allByAddress is *not* overwritten in TempWalletRepo, this falls back to the WalletRepo base class which returns the wallet, despite hasByAddress being false.
         *
         * We can add all these different methods to TempWalletRepository to make the class behave more sensibly. However, if these methods aren't intended to ever really be called on the temporary version of the wallet repository it makes sense to use a shared base interface, rather than using inheritance.
         *
         * IMO inheritance should be used very sparingly, as it is often difficult to reason about, and calling methods have side effects the calling code may not expect.
         */
        expect(walletRepoCopyOnWrite.allByAddress()).toEqual([wallet]);

        walletRepo.index(wallet);

        expect(walletRepoCopyOnWrite.has(address)).toBeTrue();
        expect(walletRepoCopyOnWrite.hasByAddress(address)).toBeTrue();
        expect(walletRepoCopyOnWrite.hasByIndex("addresses", address)).toBeTrue();
        expect(walletRepoCopyOnWrite.allByAddress()).toEqual([wallet]);

        // TODO: similarly, this behaviour is odd - as the code hasn't been overwritten in the extended class
        expect(walletRepoCopyOnWrite.has(address)).toBeTrue();
    });

    // TODO: test behaves differently to WalletRepository due to i
    it.skip("should create a wallet if one is not found during address lookup", () => {
        expect(() => walletRepoCopyOnWrite.findByAddress("hello")).not.toThrow();
        expect(walletRepoCopyOnWrite.findByAddress("iDontExist")).toBeInstanceOf(Wallet);
        expect(walletRepoCopyOnWrite.has("hello")).toBeFalse();
        expect(walletRepoCopyOnWrite.hasByAddress("iDontExist")).toBeFalse();

        /**
         * TODO: check this is desired behaviour
         * WalletRepo throws here, TempWalletRepo does not.
         */
        expect(() => walletRepoCopyOnWrite.findByIndex("addresses", "iAlsoDontExist")).not.toThrow();
    });

    describe("index", () => {
        // TODO: test behaves differently to WalletRepository due to inheritance
        it.skip("should not affect the original", () => {
            const wallet = walletRepo.createWallet("abcdef");
            walletRepo.index(wallet);

            walletRepoCopyOnWrite.index(wallet);

            expect(walletRepo.findByAddress(wallet.address)).not.toBe(
                walletRepoCopyOnWrite.findByAddress(wallet.address),
            );
        });
    });

    describe("findByAddress", () => {
        it("should return a copy", () => {
            const wallet = walletRepo.createWallet("abcdef");
            walletRepo.index(wallet);

            const tempWallet = walletRepoCopyOnWrite.findByAddress(wallet.address);
            tempWallet.balance = Utils.BigNumber.ONE;

            expect(wallet.balance).not.toEqual(tempWallet.balance);
        });
    });

    describe("findByPublicKey", () => {
        it("should return a copy", () => {
            const wallet = walletRepo.createWallet("ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp");
            wallet.publicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
            wallet.balance = Utils.BigNumber.SATOSHI;
            walletRepo.index(wallet);

            const tempWallet = walletRepoCopyOnWrite.findByPublicKey(wallet.publicKey);
            tempWallet.balance = Utils.BigNumber.ZERO;

            expect(wallet.balance).toEqual(Utils.BigNumber.SATOSHI);
            expect(tempWallet.balance).toEqual(Utils.BigNumber.ZERO);
        });
    });

    describe("findByUsername", () => {
        it("should return a copy", () => {
            const wallet = walletRepo.createWallet("abcdef");
            wallet.setAttribute("delegate", { username: "test" });
            walletRepo.index(wallet);

            const tempWallet = walletRepoCopyOnWrite.findByUsername(wallet.getAttribute("delegate.username"));
            tempWallet.balance = Utils.BigNumber.ONE;

            expect(wallet.balance).not.toEqual(tempWallet.balance);
        });
    });

    describe("hasByAddress", () => {
        it("should be ok", () => {
            const wallet = walletRepo.createWallet("abcdef");
            walletRepo.index(wallet);

            expect(walletRepoCopyOnWrite.hasByAddress(wallet.address)).toBeTrue();
        });
    });

    describe("hasByPublicKey", () => {
        it("should be ok", () => {
            const wallet = walletRepo.createWallet("ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp");
            wallet.publicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
            walletRepo.index(wallet);

            expect(walletRepoCopyOnWrite.hasByPublicKey(wallet.publicKey)).toBeTrue();
        });
    });

    describe("hasByUsername", () => {
        it("should be ok", () => {
            const wallet = walletRepo.createWallet("abcdef");
            wallet.setAttribute("delegate", { username: "test" });
            walletRepo.index(wallet);

            expect(walletRepoCopyOnWrite.hasByUsername(wallet.getAttribute("delegate.username"))).toBeTrue();
        });
    });

    describe("hasByIndex", () => {
        it("should be ok", () => {
            const wallet = walletRepo.createWallet("abc");
            wallet.setAttribute("delegate", { username: "test" });
            walletRepo.index(wallet);

            expect(walletRepoCopyOnWrite.hasByIndex(Contracts.State.WalletIndexes.Usernames, "test")).toBeTrue();
        });
    });

    describe("findByIndex", () => {
        it("should be ok", () => {
            const wallet = walletRepo.createWallet("abc");
            wallet.setAttribute("delegate", { username: "test" });
            walletRepo.index(wallet);

            expect(walletRepoCopyOnWrite.findByIndex(Contracts.State.WalletIndexes.Usernames, "test")).toEqual(wallet);
        });
    });

    // TODO: Check index where autoIndex = false
});
