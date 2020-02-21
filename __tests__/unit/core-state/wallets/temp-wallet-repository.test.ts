import "jest-extended";
import { Container, Providers, Services, Contracts } from "@arkecosystem/core-kernel";
import { Sandbox } from "@packages/core-test-framework/src";

import { Managers, Utils } from "@arkecosystem/crypto";
import { defaults } from "../../../../packages/core-state/src/defaults";
import { StateStore } from "../../../../packages/core-state/src/stores/state";
import { Wallet, TempWalletRepository, WalletRepository } from "@arkecosystem/core-state/src/wallets";
import { registerIndexers, registerFactories } from "../../../../packages/core-state/src/wallets/indexers";
import { addressesIndexer, publicKeysIndexer, ipfsIndexer, locksIndexer, resignationsIndexer, usernamesIndexer } from "@arkecosystem/core-state/src/wallets/indexers/indexers";

let sandbox: Sandbox;
let tempWalletRepo: TempWalletRepository;
let walletRepo: WalletRepository;

beforeAll(() => {
    sandbox = new Sandbox();

    sandbox.app
        .bind(Container.Identifiers.WalletAttributes)
        .to(Services.Attributes.AttributeSet)
        .inSingletonScope();

    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("delegate");
    
    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("delegate.username");

    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("delegate.resigned");

    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("htlc");
    
    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("htlc.locks");

    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("ipfs");
    
    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("ipfs.hashes");

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
        .to(WalletRepository)
        .inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "blockchain"));

    sandbox.app
        .bind(Container.Identifiers.WalletRepository)
        .to(TempWalletRepository)
        .inRequestScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "temp"));

    tempWalletRepo = sandbox.app
        .getTagged(Container.Identifiers.WalletRepository, "state", "temp");
    
    walletRepo = sandbox.app
        .getTagged(Container.Identifiers.WalletRepository, "state", "blockchain");

    Managers.configManager.setFromPreset("testnet");
});

beforeEach(() => {
    tempWalletRepo.reset();
    walletRepo.reset();
});

describe("Temp Wallet Repository", () => {
    it("should create a wallet", () => {
        const wallet = tempWalletRepo.createWallet("abcd");
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
        expect(tempWalletRepo.getIndexNames()).toEqual(expected);
        expect(tempWalletRepo.getIndex("addresses").indexer).toEqual(addressesIndexer);
        expect(tempWalletRepo.getIndex("publicKeys").indexer).toEqual(publicKeysIndexer);
        expect(tempWalletRepo.getIndex("usernames").indexer).toEqual(usernamesIndexer);
        expect(tempWalletRepo.getIndex("resignations").indexer).toEqual(resignationsIndexer);
        expect(tempWalletRepo.getIndex("locks").indexer).toEqual(locksIndexer);
        expect(tempWalletRepo.getIndex("ipfs").indexer).toEqual(ipfsIndexer);
    });

    describe("search", () => {
        it("should throw if no wallet exists", () => {
            expect(() => tempWalletRepo.findByScope(Contracts.State.SearchScope.Wallets, "1")).toThrowError(`Wallet 1 doesn't exist in indexes`);
            expect(() => tempWalletRepo.findByScope(Contracts.State.SearchScope.Delegates, "1")).toThrowError(`Wallet 1 doesn't exist in indexes`);
        });

        // TODO: is this expected behaviour that you cannot search by these scopes
        it("should throw when looking up via bridgechain, business or locks scope", () => {
            expect(() => tempWalletRepo.findByScope(Contracts.State.SearchScope.Bridgechains, "1")).toThrowError(`Unknown scope ${Contracts.State.SearchScope.Bridgechains}`);
            expect(() => tempWalletRepo.findByScope(Contracts.State.SearchScope.Businesses, "1")).toThrowError(`Unknown scope ${Contracts.State.SearchScope.Businesses}`);
            expect(() => tempWalletRepo.findByScope(Contracts.State.SearchScope.Locks, "1")).toThrowError(`Unknown scope ${Contracts.State.SearchScope.Locks}`);
        });

        it("should throw when looking up via an unknown search scope", () => {
            expect(() => tempWalletRepo.findByScope("doesNotExist" as any, "1")).toThrowError(`Unknown scope doesNotExist`);
        });

        it("should have to reindex wallet on original repo in order to search", () => {
            const wallet = tempWalletRepo.createWallet("abcd");
            expect(() => tempWalletRepo.findByScope(Contracts.State.SearchScope.Wallets, wallet.address)).toThrow();

            walletRepo.reindex(wallet);

            expect(() => tempWalletRepo.findByScope(Contracts.State.SearchScope.Wallets, wallet.address)).not.toThrow();
            expect(tempWalletRepo.findByScope(Contracts.State.SearchScope.Wallets, wallet.address)).toEqual(wallet);
        });

        it("should retrieve existing wallet when searching Delegate Scope", () => {
            const wallet = tempWalletRepo.createWallet("abcd");
            walletRepo.reindex(wallet);

            expect(() => tempWalletRepo.findByScope(Contracts.State.SearchScope.Delegates, wallet.address)).toThrowError(`Wallet abcd isn't delegate`);

            wallet.setAttribute("delegate", true);
            /**
             * TODO: check that TemptempWalletRepo should throw here.
             * WalletRepo does not.
             */
            expect(() => tempWalletRepo.findByScope(Contracts.State.SearchScope.Delegates, wallet.address)).toThrowError(`Wallet abcd isn't delegate`);
        });
    });
    
    it("findByPublicKey should reindex", () => {
        const address = "ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp";
        const wallet = tempWalletRepo.createWallet(address);
        const publicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
        wallet.publicKey = publicKey;

        expect(tempWalletRepo.findByAddress(address)).not.toEqual(wallet);
        tempWalletRepo.getIndex("publicKeys").set(publicKey, wallet);
        expect(tempWalletRepo.findByPublicKey(publicKey).publicKey).toBeDefined();
        expect(tempWalletRepo.findByPublicKey(publicKey)).toEqual(wallet);

        /**
         * TODO: check this is desired behaviour?
         * TempWalletRepository calls reindex inside findByPublicKey (unlike WalletRepository).
         * This has the effect that these are now defined without needing to reindex
         */
        expect(tempWalletRepo.findByAddress(address).publicKey).toBeDefined();
        expect(tempWalletRepo.findByAddress(address)).toEqual(wallet);
    });

    it("should not retrieve wallets indexed in original repo, until they are indexed", () => {
        const address = "abcd";

        const wallet = tempWalletRepo.createWallet(address);
        tempWalletRepo.reindex(wallet);
    
        /**
         * TODO: check this is desired behaviour
         * has, hasByAddress and hasByIndex all behave differently because of the problem of inheritance.
         * I've added has and hasByIndex to TempWalletRepo to fix this (i.e. these should all return false, not just one of them), but in general this architecture needs revisiting.
         */
        expect(tempWalletRepo.has(address)).toBeFalse();
        expect(tempWalletRepo.hasByAddress(address)).toBeFalse();
        expect(tempWalletRepo.hasByIndex("addresses", address)).toBeFalse();
        /**
         *  For example, because allByAddress is *not* overwritten in TempWalletRepo, this falls back to the WalletRepo base class which returns the wallet, despite hasByAddress being false.
         * 
         * We can add all these different methods to TempWalletRepository to make the class behave more sensibly. However, if these methods aren't intended to ever really be called on the temporary version of the wallet repository it makes sense to use a shared base interface, rather than using inheritance.
         * 
         * IMO inheritance should be used very sparingly, as it is often difficult to reason about, and calling methods have side effects the calling code may not expect.
         */
        expect(tempWalletRepo.allByAddress()).toEqual([wallet]);

        walletRepo.reindex(wallet);
            
        expect(tempWalletRepo.has(address)).toBeTrue();
        expect(tempWalletRepo.hasByAddress(address)).toBeTrue();
        expect(tempWalletRepo.hasByIndex("addresses", address)).toBeTrue();
        expect(tempWalletRepo.allByAddress()).toEqual([wallet]);

        // TODO: similarly, this behaviour is odd - as the code hasn't been overwritten in the extended class
        tempWalletRepo.forgetByAddress(address);
        expect(tempWalletRepo.has(address)).toBeTrue();
    });

    /**
     * TODO: check this is desired behaviour
     * 
     */
    it("should create a wallet if one is not found during address lookup", () => {
        expect(() => tempWalletRepo.findByAddress("hello")).not.toThrow();
        expect(tempWalletRepo.findByAddress("iDontExist")).toBeInstanceOf(Wallet);
        expect(tempWalletRepo.has("hello")).toBeFalse();
        expect(tempWalletRepo.hasByAddress('iDontExist')).toBeFalse();
       
        /**
         * TODO: check this is desired behaviour
         * WalletRepo throws here, TempWalletRepo does not.
         */
        expect(() => tempWalletRepo.findByIndex("addresses", "iAlsoDontExist")).not.toThrow();
    });

    describe("reindex", () => {
        it("should not affect the original", () => {
            const wallet = walletRepo.createWallet("abcdef");
            walletRepo.reindex(wallet);

            tempWalletRepo.reindex(wallet);

            expect(walletRepo.findByAddress(wallet.address)).not.toBe(
                tempWalletRepo.findByAddress(wallet.address),
            );
        });
    });

    describe("findByAddress", () => {
        it("should return a copy", () => {
            const wallet = walletRepo.createWallet("abcdef");
            walletRepo.reindex(wallet);

            const tempWallet = tempWalletRepo.findByAddress(wallet.address);
            tempWallet.balance = Utils.BigNumber.ONE;

            expect(wallet.balance).not.toEqual(tempWallet.balance);
        });
    });

    describe("findByPublickey", () => {
        it("should return a copy", () => {
            const wallet = walletRepo.createWallet("ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp");
            wallet.publicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
            wallet.balance = Utils.BigNumber.SATOSHI;
            walletRepo.reindex(wallet);

            const tempWallet = tempWalletRepo.findByPublicKey(wallet.publicKey);
            tempWallet.balance = Utils.BigNumber.ZERO;

            expect(wallet.balance).toEqual(Utils.BigNumber.SATOSHI);
            expect(tempWallet.balance).toEqual(Utils.BigNumber.ZERO);
        });
    });

    describe("findByUsername", () => {
        it("should return a copy", () => {
            const wallet = walletRepo.createWallet("abcdef");
            wallet.setAttribute("delegate", { username: "test" });
            walletRepo.reindex(wallet);

            const tempWallet = tempWalletRepo.findByUsername(wallet.getAttribute("delegate.username"));
            tempWallet.balance = Utils.BigNumber.ONE;

            expect(wallet.balance).not.toEqual(tempWallet.balance);
        });
    });

    describe("hasByAddress", () => {
        it("should be ok", () => {
            const wallet = walletRepo.createWallet("abcdef");
            walletRepo.reindex(wallet);

            expect(tempWalletRepo.hasByAddress(wallet.address)).toBeTrue();
        });
    });

    describe("hasByPublicKey", () => {
        it("should be ok", () => {
            const wallet = walletRepo.createWallet("ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp");
            wallet.publicKey = "03720586a26d8d49ec27059bd4572c49ba474029c3627715380f4df83fb431aece";
            walletRepo.reindex(wallet);

            expect(tempWalletRepo.hasByPublicKey(wallet.publicKey)).toBeTrue();
        });
    });

    describe("hasByUsername", () => {
        it("should be ok", () => {
            const wallet = walletRepo.createWallet("abcdef");
            wallet.setAttribute("delegate", { username: "test" });
            walletRepo.reindex(wallet);

            expect(tempWalletRepo.hasByUsername(wallet.getAttribute("delegate.username"))).toBeTrue();
        });
    });
});