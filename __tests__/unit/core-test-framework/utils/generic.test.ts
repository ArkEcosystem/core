import "jest-extended";

import { performance } from "perf_hooks";
import { Generators, Sandbox } from "@packages/core-test-framework";
import { Identities, Interfaces, Managers, Utils } from "@packages/crypto";
import { Container } from "@packages/core-kernel";
import { Mocks } from "@packages/core-test-framework";
import { Block } from "@packages/core-database/src/models";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import {
    getLastHeight,
    getSenderNonce,
    getWalletNonce,
    injectMilestone,
    resetBlockchain,
    snoozeForBlock,
} from "@packages/core-test-framework/src/utils/generic";

let sandbox: Sandbox;

let config = Generators.generateCryptoConfigRaw();

beforeEach(async () => {
    for (let item of config.milestones) {
        item.blocktime = 2;
    }
    Managers.configManager.setConfig(config);

    sandbox = new Sandbox();

    sandbox.app.bind(Container.Identifiers.StateStore).toConstantValue(Mocks.StateStore.instance);

    sandbox.app.bind(Container.Identifiers.BlockchainService).toConstantValue(Mocks.Blockchain.instance);

    sandbox.app
        .bind(Container.Identifiers.WalletRepository)
        .toConstantValue(Mocks.WalletRepository.instance)
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "blockchain"));
});

afterEach(() => {
    jest.resetAllMocks();

    Mocks.StateStore.setLastHeight(0);

    Mocks.Blockchain.setBlock(undefined);

    Mocks.WalletRepository.setNonce(Utils.BigNumber.make(1));
});

describe("Generic", () => {
    describe("snoozeForBlock", () => {
        it("should snooze", async () => {
            let start = performance.now();

            await snoozeForBlock();

            let end = performance.now();

            // Test with 2 sec blocktime
            expect(end - start).toBeGreaterThan(1900);
            expect(end - start).toBeLessThan(4100);
        });
    });

    describe("injectMilestone", () => {
        it("should inject milestone", async () => {
            let oldMilestonesLength = Managers.configManager.getMilestones().length;

            injectMilestone(0, { test: "test_milestone" });

            let newMilestonesLength = Managers.configManager.getMilestones().length;

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
            Mocks.WalletRepository.setNonce(Utils.BigNumber.make(5));

            expect(getSenderNonce(sandbox.app, Identities.PublicKey.fromPassphrase(passphrases[0]))).toEqual(
                Utils.BigNumber.make(5),
            );
        });
    });

    describe("resetBlockchain", () => {
        it("should reset blockchain", async () => {
            let mockBlock: Partial<Block> = {
                id: "f3785026728a5d8c72accb49623d4f8837038630b48bbbf3f94273e50a47c176",
                version: 2,
                height: 2,
                timestamp: 2,
                reward: Utils.BigNumber.make("100"),
                totalFee: Utils.BigNumber.make("200"),
                totalAmount: Utils.BigNumber.make("300"),
                generatorPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
            };

            Mocks.Blockchain.setBlock({ data: mockBlock } as Partial<Interfaces.IBlock>);

            let spyOnRemoveBlocks = jest.spyOn(Mocks.Blockchain.instance, "removeBlocks");

            await expect(resetBlockchain(sandbox.app)).toResolve();
            expect(spyOnRemoveBlocks).toHaveBeenCalled();
        });
    });

    describe("getWalletNonce", () => {
        it("should return wallet nonce", async () => {
            Mocks.WalletRepository.setNonce(Utils.BigNumber.make(5));

            expect(getWalletNonce(sandbox.app, Identities.PublicKey.fromPassphrase(passphrases[0]))).toEqual(
                Utils.BigNumber.make(5),
            );
        });

        it("should return zero on error", async () => {
            Mocks.WalletRepository.setNonce(Utils.BigNumber.make(5));

            let spyOnGetNonce = jest
                .spyOn(Mocks.WalletRepository.instance, "getNonce")
                .mockImplementation((publicKey: string) => {
                    throw new Error();
                });

            expect(getWalletNonce(sandbox.app, Identities.PublicKey.fromPassphrase(passphrases[0]))).toEqual(
                Utils.BigNumber.make(0),
            );
            expect(spyOnGetNonce).toHaveBeenCalled();
        });
    });
});
