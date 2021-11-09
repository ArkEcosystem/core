import { Identifiers as ApiIdentifiers, LockSearchService } from "@packages/core-api/src";
import { Container, Contracts } from "@packages/core-kernel";
import { Enums, Identities, Utils } from "@packages/crypto";

import { setUp } from "./__support__/setup";

const jestfn = <T extends (...args: unknown[]) => unknown>(
    implementation?: (...args: Parameters<T>) => ReturnType<T>,
) => {
    return jest.fn(implementation);
};

const lockId1 = "dff41cc95ad6b2fc1277328a7532d93b3ddb52da74742de304f00bada582c82a";
const lockAttribute1 = {
    amount: Utils.BigNumber.make("1000"),
    recipientId: Identities.Address.fromPassphrase("recipient1"),
    timestamp: 109038032,
    vendorField: "lock1",
    secretHash: "b864de7530bbf243211971490e67d6ca14c3a8ff66fc62822b0b29ee1a1ef578",
    expiration: {
        type: Enums.HtlcLockExpirationType.BlockHeight,
        value: 1000000,
    },
};

const lockId2 = "4deac1e54cba315fab7c9d6f2b63c1f48c28fcf1e7191c6202ea431b3dd507c8";
const lockAttribute2 = {
    amount: Utils.BigNumber.make("2000"),
    recipientId: Identities.Address.fromPassphrase("recipient2"),
    timestamp: 109038064,
    vendorField: "lock2",
    secretHash: "a2d127c4fd60f1680e3b46b0f7e1345d80a40de5c8db31b019292b926fd1ca06",
    expiration: {
        type: Enums.HtlcLockExpirationType.BlockHeight,
        value: 2000000,
    },
};

const stateStore = {
    getLastBlock: jestfn<Contracts.State.StateStore["getLastBlock"]>(),
};

let walletRepository: Contracts.State.WalletRepository;
let lockSearchService: LockSearchService;

beforeEach(async () => {
    jest.resetAllMocks();

    const app = await setUp();
    app.rebind(Container.Identifiers.StateStore).toConstantValue(stateStore);

    walletRepository = app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    lockSearchService = app.get<LockSearchService>(ApiIdentifiers.LockSearchService);
});

describe("LockSearchService.getLock", () => {
    it("should return lock resource by id", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("wallet1"));
        wallet1.setAttribute("htlc.locks", { [lockId1]: lockAttribute1 });
        walletRepository.index(wallet1);

        stateStore.getLastBlock.mockReturnValue({ data: { height: 1000 } } as any);
        const lockResource1 = lockSearchService.getLock(lockId1);

        expect(lockResource1.lockId).toEqual(lockId1);
    });

    it("should return undefined when lock wasn't found", () => {
        const lockResource = lockSearchService.getLock("non existing lock id");
        expect(lockResource).toBe(undefined);
    });
});

describe("LockSearchService.getLocksPage", () => {
    it("should return all locks", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("wallet1"));
        wallet1.setAttribute("htlc.locks", { [lockId1]: lockAttribute1 });
        walletRepository.index(wallet1);

        const wallet2 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("wallet2"));
        wallet2.setAttribute("htlc.locks", { [lockId2]: lockAttribute2 });
        walletRepository.index(wallet2);

        stateStore.getLastBlock.mockReturnValue({ data: { height: 1000 } } as any);
        const locksPage = lockSearchService.getLocksPage({ offset: 0, limit: 100 }, [
            { property: "amount", direction: "asc" },
        ]);

        expect(locksPage.totalCount).toBe(2);
        expect(locksPage.results[0].lockId).toBe(lockId1);
        expect(locksPage.results[1].lockId).toBe(lockId2);
    });

    it("should return locks that match criteria", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("wallet1"));
        wallet1.setAttribute("htlc.locks", { [lockId1]: lockAttribute1 });
        walletRepository.index(wallet1);

        const wallet2 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("wallet2"));
        wallet2.setAttribute("htlc.locks", { [lockId2]: lockAttribute2 });
        walletRepository.index(wallet2);

        stateStore.getLastBlock.mockReturnValue({ data: { height: 1000 } } as any);
        const locksPage = lockSearchService.getLocksPage(
            { offset: 0, limit: 100 },
            [{ property: "amount", direction: "asc" }],
            { amount: "1000" },
        );

        expect(locksPage.totalCount).toBe(1);
        expect(locksPage.results[0].lockId).toBe(lockId1);
    });
});

describe("LockSearchService.getWalletLocksPage", () => {
    it("should return all wallet locks", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("wallet1"));
        wallet1.setAttribute("htlc.locks", { [lockId1]: lockAttribute1, [lockId2]: lockAttribute2 });
        walletRepository.index(wallet1);

        stateStore.getLastBlock.mockReturnValue({ data: { height: 1000 } } as any);
        const locksPage = lockSearchService.getWalletLocksPage(
            { offset: 0, limit: 100 },
            [{ property: "amount", direction: "asc" }],
            wallet1.getAddress(),
        );

        expect(locksPage.totalCount).toBe(2);
        expect(locksPage.results[0].lockId).toBe(lockId1);
        expect(locksPage.results[1].lockId).toBe(lockId2);
    });

    it("should return all wallet locks that match criteria", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("wallet1"));
        wallet1.setAttribute("htlc.locks", { [lockId1]: lockAttribute1, [lockId2]: lockAttribute2 });
        walletRepository.index(wallet1);

        stateStore.getLastBlock.mockReturnValue({ data: { height: 1000 } } as any);
        const locksPage = lockSearchService.getWalletLocksPage(
            { offset: 0, limit: 100 },
            [{ property: "amount", direction: "asc" }],
            wallet1.getAddress(),
            { amount: "1000" },
        );

        expect(locksPage.totalCount).toBe(1);
        expect(locksPage.results[0].lockId).toBe(lockId1);
    });

    it("should return only wallet locks", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("wallet1"));
        wallet1.setAttribute("htlc.locks", { [lockId1]: lockAttribute1 });
        walletRepository.index(wallet1);

        const wallet2 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("wallet2"));
        wallet2.setAttribute("htlc.locks", { [lockId2]: lockAttribute2 });
        walletRepository.index(wallet2);

        stateStore.getLastBlock.mockReturnValue({ data: { height: 1000 } } as any);
        const locksPage = lockSearchService.getWalletLocksPage(
            { offset: 0, limit: 100 },
            [{ property: "amount", direction: "asc" }],
            wallet1.getAddress(),
        );

        expect(locksPage.totalCount).toBe(1);
        expect(locksPage.results[0].lockId).toBe(lockId1);
    });
});
