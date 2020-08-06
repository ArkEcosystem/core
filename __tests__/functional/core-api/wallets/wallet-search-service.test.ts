import { WalletSearchService } from "@arkecosystem/core-api";
import { Application, Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { ServiceProvider as StateServiceProvider } from "@arkecosystem/core-state";
import { Identities, Utils } from "@arkecosystem/crypto";

const jestfn = <T extends (...args: unknown[]) => unknown>(
    implementation?: (...args: Parameters<T>) => ReturnType<T>,
) => {
    return jest.fn(implementation);
};

const triggerService = {
    bind: jestfn<Services.Triggers.Triggers["bind"]>(),
};

const walletAttributes = {
    has: jestfn<Services.Attributes.AttributeSet["has"]>(),
};

let app: Application;
let walletRepository: Contracts.State.WalletRepository;
let walletSearchService: WalletSearchService;

beforeEach(async () => {
    triggerService.bind.mockReset();
    walletAttributes.has.mockReset();
    walletAttributes.has.mockReturnValue(true);

    app = new Application(new Container.Container());

    app.bind(Container.Identifiers.TriggerService).toConstantValue(triggerService);
    app.bind(Container.Identifiers.WalletAttributes).toConstantValue(walletAttributes);

    await app.resolve<StateServiceProvider>(StateServiceProvider).register();

    walletRepository = app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    walletSearchService = app.resolve(WalletSearchService);
});

describe("WalletSearchService.getWallet", () => {
    it("should get wallet by address", async () => {
        const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        const walletResource = walletSearchService.getWallet(wallet.address);

        expect(walletResource.address).toEqual(wallet.address);
    });

    it("should not get wallet by address", async () => {
        walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        const walletResource = walletSearchService.getWallet("not really an address");

        expect(walletResource).toBe(undefined);
    });

    it("should get wallet by publicKey", async () => {
        const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        const walletResource = walletSearchService.getWallet(Identities.PublicKey.fromPassphrase("secret"));

        expect(walletResource.address).toBe(wallet.address);
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
        const walletResource = walletSearchService.getWallet("test_username");

        expect(walletResource.address).toBe(wallet.address);
    });

    it("should not get wallet by username", async () => {
        const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        wallet.setAttribute<string>("delegate.username", "test_username");
        walletRepository.index(wallet);
        const walletResource = walletSearchService.getWallet("test_username_2");

        expect(walletResource).toBe(undefined);
    });

    it("should get wallet with additional filter", () => {
        const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        wallet.setAttribute<string>("delegate.username", "test_username");
        walletRepository.index(wallet);
        const walletResource = walletSearchService.getWallet(wallet.address, {
            attributes: { delegate: { username: "test_username" } },
        });

        expect(walletResource.address).toBe(wallet.address);
    });

    it("should not get wallet with additional filter", () => {
        const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        wallet.setAttribute<string>("delegate.username", "test_username");
        walletRepository.index(wallet);
        const walletResource = walletSearchService.getWallet(wallet.address, {
            attributes: { delegate: { username: "test_username_2" } },
        });

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

        wallet1.balance = Utils.BigNumber.make("100");
        wallet2.balance = Utils.BigNumber.make("200");
        wallet3.balance = Utils.BigNumber.make("300");
        wallet4.balance = Utils.BigNumber.make("40");
        wallet5.balance = Utils.BigNumber.make("50");

        const page = walletSearchService.getWalletsPage({ limit: 3, offset: 0 }, []);

        expect(page.results.length).toBe(3);
        expect(page.results[0].address).toBe(wallet3.address);
        expect(page.results[1].address).toBe(wallet2.address);
        expect(page.results[2].address).toBe(wallet1.address);
        expect(page.totalCount).toBe(5);
    });

    it("should get last two wallets sorted by balance:desc", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret1"));
        const wallet2 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret2"));
        const wallet3 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret3"));
        const wallet4 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret4"));
        const wallet5 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret5"));

        wallet1.balance = Utils.BigNumber.make("100");
        wallet2.balance = Utils.BigNumber.make("200");
        wallet3.balance = Utils.BigNumber.make("300");
        wallet4.balance = Utils.BigNumber.make("40");
        wallet5.balance = Utils.BigNumber.make("50");

        const page = walletSearchService.getWalletsPage({ limit: 3, offset: 3 }, []);

        expect(page.results.length).toBe(2);
        expect(page.results[0].address).toBe(wallet5.address);
        expect(page.results[1].address).toBe(wallet4.address);
        expect(page.totalCount).toBe(5);
    });

    it("should get only three wallets sorted by balance:desc", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret1"));
        const wallet2 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret2"));
        const wallet3 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret3"));
        const wallet4 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret4"));
        const wallet5 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret5"));

        wallet1.balance = Utils.BigNumber.make("100");
        wallet2.balance = Utils.BigNumber.make("200");
        wallet3.balance = Utils.BigNumber.make("300");
        wallet4.balance = Utils.BigNumber.make("40");
        wallet5.balance = Utils.BigNumber.make("50");

        const page = walletSearchService.getWalletsPage({ limit: 5, offset: 0 }, [], { balance: { from: "100" } });

        expect(page.results.length).toBe(3);
        expect(page.results[0].address).toBe(wallet3.address);
        expect(page.results[1].address).toBe(wallet2.address);
        expect(page.results[2].address).toBe(wallet1.address);
        expect(page.totalCount).toBe(3);
    });
});
