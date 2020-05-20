import "jest-extended";

import { performance } from "perf_hooks";

import { CryptoSuite, Interfaces } from "../../../../packages/core-crypto";
import { Block } from "../../../../packages/core-database/src/models";
import { Container } from "../../../../packages/core-kernel";
import { Generators, Sandbox } from "../../../../packages/core-test-framework/src";
import { Mocks } from "../../../../packages/core-test-framework/src";
import passphrases from "../../../../packages/core-test-framework/src/internal/passphrases.json";
import {
    getLastHeight,
    getSenderNonce,
    getWalletNonce,
    injectMilestone,
    resetBlockchain,
    snoozeForBlock,
} from "../../../../packages/core-test-framework/src/utils/generic";

let sandbox: Sandbox;
let crypto: CryptoSuite.CryptoSuite;
let Identities;
let walletRepository;

beforeEach(async () => {
    crypto = new CryptoSuite.CryptoSuite(Generators.generateCryptoConfigRaw());

    sandbox = new Sandbox();
    Identities = crypto.CryptoManager.Identities;

    for (const item of crypto.CryptoManager.MilestoneManager.getMilestones()) {
        item.blocktime = 2;
    }

    sandbox.app.bind(Container.Identifiers.StateStore).toConstantValue(Mocks.StateStore.instance);

    sandbox.app.bind(Container.Identifiers.BlockchainService).toConstantValue(Mocks.Blockchain.instance);

    walletRepository = new Mocks.WalletRepository.WalletRepository(crypto.CryptoManager);
    sandbox.app
        .bind(Container.Identifiers.WalletRepository)
        .toConstantValue(walletRepository)
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "blockchain"));
});

afterEach(() => {
    jest.resetAllMocks();

    Mocks.StateStore.setLastHeight(0);

    Mocks.Blockchain.setBlock(undefined);
    walletRepository.setNonce(crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(1));
});

describe("Generic", () => {
    describe("snoozeForBlock", () => {
        it("should snooze", async () => {
            const start = performance.now();

            await snoozeForBlock(crypto.CryptoManager);

            const end = performance.now();

            // Test with 2 sec blocktime
            expect(end - start).toBeGreaterThan(1900);
            expect(end - start).toBeLessThan(4100);
        });
    });

    describe("injectMilestone", () => {
        it("should inject milestone", async () => {
            const oldMilestonesLength = crypto.CryptoManager.MilestoneManager.getMilestones().length;

            injectMilestone(crypto.CryptoManager, 0, { test: "test_milestone" });

            const newMilestonesLength = crypto.CryptoManager.MilestoneManager.getMilestones().length;

            expect(newMilestonesLength).not.toEqual(oldMilestonesLength);
        });
    });

    describe("getLastHeight", () => {
        it("should return last height", async () => {
            Mocks.StateStore.setLastHeight(5);

            expect(getLastHeight(sandbox.app)).toBe(5);
        });
    });

    describe("getSenderNonce", () => {
        it("should return sender nonce", async () => {
            walletRepository.setNonce(crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(5));

            expect(getSenderNonce(sandbox.app, Identities.PublicKey.fromPassphrase(passphrases[0]))).toEqual(
                crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(5),
            );
        });
    });

    describe("resetBlockchain", () => {
        it("should reset blockchain", async () => {
            const mockBlock: Partial<Block> = {
                id: "f3785026728a5d8c72accb49623d4f8837038630b48bbbf3f94273e50a47c176",
                version: 2,
                height: 2,
                timestamp: 2,
                reward: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("100"),
                totalFee: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("200"),
                totalAmount: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("300"),
                generatorPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
            };

            Mocks.Blockchain.setBlock({ data: mockBlock } as Partial<Interfaces.IBlock>);

            const spyOnRemoveBlocks = jest.spyOn(Mocks.Blockchain.instance, "removeBlocks");

            await expect(resetBlockchain(sandbox.app)).toResolve();
            expect(spyOnRemoveBlocks).toHaveBeenCalled();
        });
    });

    describe("getWalletNonce", () => {
        it("should return wallet nonce", async () => {
            walletRepository.setNonce(crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(5));

            expect(
                getWalletNonce(sandbox.app, crypto.CryptoManager, Identities.PublicKey.fromPassphrase(passphrases[0])),
            ).toEqual(crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(5));
        });

        it("should return zero on error", async () => {
            walletRepository.setNonce(crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(5));

            const spyOnGetNonce = jest.spyOn(walletRepository, "getNonce").mockImplementation((publicKey: string) => {
                throw new Error();
            });

            expect(
                getWalletNonce(sandbox.app, crypto.CryptoManager, Identities.PublicKey.fromPassphrase(passphrases[0])),
            ).toEqual(crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO);
            expect(spyOnGetNonce).toHaveBeenCalled();
        });
    });
});
