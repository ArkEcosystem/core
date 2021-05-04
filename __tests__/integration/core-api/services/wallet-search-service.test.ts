import { Identifiers as ApiIdentifiers, WalletSearchService } from "@arkecosystem/core-api/src";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Identities, Utils } from "@arkecosystem/crypto";

import { setUp } from "./__support__/setup";

let walletRepository: Contracts.State.WalletRepository;
let walletSearchService: WalletSearchService;

beforeEach(async () => {
    const app = await setUp();

    walletRepository = app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    walletSearchService = app.get<WalletSearchService>(ApiIdentifiers.WalletSearchService);
});

describe("WalletSearchService.getWallet", () => {
    it("should get wallet by address", async () => {
        const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        const walletResource = walletSearchService.getWallet(wallet.getAddress())!;

        expect(walletResource.address).toEqual(wallet.getAddress());
    });

    it("should not get wallet by address", async () => {
        walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        const walletResource = walletSearchService.getWallet("not an address");

        expect(walletResource).toBe(undefined);
    });

    it("should get wallet by publicKey", async () => {
        const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        const walletResource = walletSearchService.getWallet(Identities.PublicKey.fromPassphrase("secret"))!;

        expect(walletResource.address).toBe(wallet.getAddress());
    });

    it("should not get wallet by publicKey", async () => {
        walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        const walletResource = walletSearchService.getWallet(Identities.PublicKey.fromPassphrase("other secret"));

        expect(walletResource).toBe(undefined);
    });

    it("should get wallet by username", async () => {
        const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        wallet.setAttribute<string>("delegate.username", "test_username");
        walletRepository.index(wallet);
        const walletResource = walletSearchService.getWallet("test_username")!;

        expect(walletResource.address).toBe(wallet.getAddress());
    });

    it("should not get wallet by username", async () => {
        const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        wallet.setAttribute<string>("delegate.username", "test_username");
        walletRepository.index(wallet);
        const walletResource = walletSearchService.getWallet("test_username_2");

        expect(walletResource).toBe(undefined);
    });
});

describe("WalletSearchService.getWalletsPage", () => {
    it("should get first three wallets sorted by balance:desc", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret1"));
        const wallet2 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret2"));
        const wallet3 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret3"));
        const wallet4 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret4"));
        const wallet5 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret5"));

        wallet1.setBalance(Utils.BigNumber.make("100"));
        wallet2.setBalance(Utils.BigNumber.make("200"));
        wallet3.setBalance(Utils.BigNumber.make("300"));
        wallet4.setBalance(Utils.BigNumber.make("40"));
        wallet5.setBalance(Utils.BigNumber.make("50"));

        const page = walletSearchService.getWalletsPage({ limit: 3, offset: 0 }, []);

        expect(page.results.length).toBe(3);
        expect(page.results[0].address).toBe(wallet3.getAddress());
        expect(page.results[1].address).toBe(wallet2.getAddress());
        expect(page.results[2].address).toBe(wallet1.getAddress());
        expect(page.totalCount).toBe(5);
    });

    it("should get last two wallets sorted by balance:desc", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret1"));
        const wallet2 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret2"));
        const wallet3 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret3"));
        const wallet4 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret4"));
        const wallet5 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret5"));

        wallet1.setBalance(Utils.BigNumber.make("100"));
        wallet2.setBalance(Utils.BigNumber.make("200"));
        wallet3.setBalance(Utils.BigNumber.make("300"));
        wallet4.setBalance(Utils.BigNumber.make("40"));
        wallet5.setBalance(Utils.BigNumber.make("50"));

        const page = walletSearchService.getWalletsPage({ limit: 3, offset: 3 }, []);

        expect(page.results.length).toBe(2);
        expect(page.results[0].address).toBe(wallet5.getAddress());
        expect(page.results[1].address).toBe(wallet4.getAddress());
        expect(page.totalCount).toBe(5);
    });

    it("should get only three wallets sorted by balance:desc", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret1"));
        const wallet2 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret2"));
        const wallet3 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret3"));
        const wallet4 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret4"));
        const wallet5 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret5"));

        wallet1.setBalance(Utils.BigNumber.make("100"));
        wallet2.setBalance(Utils.BigNumber.make("200"));
        wallet3.setBalance(Utils.BigNumber.make("300"));
        wallet4.setBalance(Utils.BigNumber.make("40"));
        wallet5.setBalance(Utils.BigNumber.make("50"));

        const page = walletSearchService.getWalletsPage({ limit: 5, offset: 0 }, [], { balance: { from: "100" } });

        expect(page.results.length).toBe(3);
        expect(page.results[0].address).toBe(wallet3.getAddress());
        expect(page.results[1].address).toBe(wallet2.getAddress());
        expect(page.results[2].address).toBe(wallet1.getAddress());
        expect(page.totalCount).toBe(3);
    });
});

describe("WalletSearchService.getActiveWalletsPage", () => {
    it("should only get wallets with public keys", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret1"));
        const wallet2 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret2"));
        const wallet3 = walletRepository.findByAddress(Identities.Address.fromPassphrase("secret3"));
        const wallet4 = walletRepository.findByAddress(Identities.Address.fromPassphrase("secret4"));
        const wallet5 = walletRepository.findByAddress(Identities.Address.fromPassphrase("secret5"));

        wallet1.setBalance(Utils.BigNumber.make("100"));
        wallet2.setBalance(Utils.BigNumber.make("200"));
        wallet3.setBalance(Utils.BigNumber.make("300"));
        wallet4.setBalance(Utils.BigNumber.make("400"));
        wallet5.setBalance(Utils.BigNumber.make("500"));

        const page = walletSearchService.getActiveWalletsPage({ offset: 0, limit: 100 }, [
            { property: "balance", direction: "asc" },
        ]);

        expect(page.totalCount).toBe(2);
        expect(page.results[0].address).toBe(wallet1.getAddress());
        expect(page.results[1].address).toBe(wallet2.getAddress());
    });
});
