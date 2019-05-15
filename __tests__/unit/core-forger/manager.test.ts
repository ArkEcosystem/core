import "jest-extended";

import "./mocks/core-container";

import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { NetworkState, NetworkStateStatus } from "@arkecosystem/core-p2p";
import { Transactions } from "@arkecosystem/crypto";
import { defaults } from "../../../packages/core-forger/src/defaults";
import { Delegate } from "../../../packages/core-forger/src/delegate";
import { ForgerManager } from "../../../packages/core-forger/src/manager";
import { testnet } from "../../../packages/crypto/src/networks";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { sampleBlock } from "./__fixtures__/block";
import { delegate } from "./__fixtures__/delegate";
import { sampleTransaction } from "./__fixtures__/transaction";

jest.setTimeout(30000);
jest.mock("../../../packages/core-forger/src/client");

let forgeManager;

afterAll(async () => {
    jest.restoreAllMocks();
});

beforeEach(() => {
    defaults.hosts = [{ hostname: "127.0.0.1", port: 4000 }];
    forgeManager = new ForgerManager(defaults);
});

describe("Forger Manager", () => {
    describe("forgeNewBlock", () => {
        it("should forge a block", async () => {
            // NOTE: make sure we have valid transactions from an existing wallet
            const transactions = TransactionFactory.transfer()
                .withNetwork("testnet")
                .withPassphrase("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
                .build();

            // @ts-ignore
            forgeManager.client.getTransactions.mockReturnValue({
                transactions: transactions.map(tx => tx.serialized.toString("hex")),
            });

            forgeManager.usernames = [];

            const del = new Delegate("a secret", testnet.network);
            const round = {
                lastBlock: { id: sampleBlock.data.id, height: sampleBlock.data.height },
                timestamp: 1,
                reward: 2 * 1e8,
            };

            await forgeManager.forgeNewBlock(del, round, {
                lastBlockId: round.lastBlock.id,
                nodeHeight: round.lastBlock.height,
            });

            expect(forgeManager.client.broadcastBlock).toHaveBeenCalledWith(
                expect.objectContaining({
                    height: round.lastBlock.height + 1,
                    reward: round.reward.toFixed(),
                }),
            );
            expect(forgeManager.client.emitEvent).toHaveBeenCalledWith(
                ApplicationEvents.BlockForged,
                expect.any(Object),
            );
            expect(forgeManager.client.emitEvent).toHaveBeenCalledWith(
                ApplicationEvents.TransactionForged,
                expect.any(Object),
            );
        });
    });

    describe("checkSlot", () => {
        it("should emit failed event if error while monitoring", async () => {
            forgeManager.client.getRound.mockRejectedValue(new Error("oh bollocks"));

            setTimeout(() => forgeManager.stopForging(), 1000);
            await forgeManager.checkSlot();

            expect(forgeManager.client.emitEvent).toHaveBeenCalledWith(ApplicationEvents.ForgerFailed, "oh bollocks");
        });
    });

    describe("getTransactionsForForging", () => {
        it("should return zero transactions if none to forge", async () => {
            // @ts-ignore
            forgeManager.client.getTransactions.mockReturnValue({});

            const transactions = await forgeManager.getTransactionsForForging();

            expect(transactions).toHaveLength(0);
            expect(forgeManager.client.getTransactions).toHaveBeenCalled();
        });
        it("should return deserialized transactions", async () => {
            // @ts-ignore
            forgeManager.client.getTransactions.mockReturnValue({
                transactions: [Transactions.TransactionFactory.fromData(sampleTransaction).serialized.toString("hex")],
            });

            const transactions = await forgeManager.getTransactionsForForging();

            expect(transactions).toHaveLength(1);
            expect(forgeManager.client.getTransactions).toHaveBeenCalled();
            expect(transactions[0].recipientId).toEqual(sampleTransaction.recipientId);
            expect(transactions[0].senderPublicKey).toEqual(sampleTransaction.senderPublicKey);
        });
    });

    describe("isForgingAllowed", () => {
        it("should be TRUE when quorum > 0.66", async () => {
            const networkState = new NetworkState(NetworkStateStatus.Default);
            Object.assign(networkState, { getQuorum: () => 0.9, nodeHeight: 100, lastBlockId: "1233443" });

            const canForge = await forgeManager.isForgingAllowed(networkState, delegate);

            expect(canForge).toBeTrue();
        });

        it("should be FALSE when unknown", async () => {
            const networkState = new NetworkState(NetworkStateStatus.Unknown);
            Object.assign(networkState, { getQuorum: () => 1, nodeHeight: 100, lastBlockId: "1233443" });

            const canForge = await forgeManager.isForgingAllowed(networkState, delegate);

            expect(canForge).toBeFalse();
        });

        it("should be FALSE when quorum < 0.66", async () => {
            const networkState = new NetworkState(NetworkStateStatus.Default);
            Object.assign(networkState, { getQuorum: () => 0.65, nodeHeight: 100, lastBlockId: "1233443" });

            const canForge = await forgeManager.isForgingAllowed(networkState, delegate);

            expect(canForge).toBeFalse();
        });

        it("should be FALSE when coldStart is active", async () => {
            const networkState = new NetworkState(NetworkStateStatus.ColdStart);
            const canForge = await forgeManager.isForgingAllowed(networkState, delegate);

            expect(canForge).toBeFalse();
        });

        it("should be FALSE when minimumNetworkReach is not sufficient", async () => {
            const networkState = new NetworkState(NetworkStateStatus.BelowMinimumPeers);
            const canForge = await forgeManager.isForgingAllowed(networkState, delegate);

            expect(canForge).toBeFalse();
        });

        it("should be FAIL and detect possible double forging", async () => {
            forgeManager.usernames = [];

            const networkState = new NetworkState(NetworkStateStatus.Default);
            Object.assign(networkState, {
                getQuorum: () => 1,
                nodeHeight: 100,
                lastBlockId: "1233443",
                quorumDetails: {
                    peersOverHeightBlockHeaders: {
                        "2816806946235018296": {
                            id: "2816806946235018296",
                            height: 2360065,
                            generatorPublicKey: "0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0",
                        },
                    },
                },
            });

            const canForge = await forgeManager.isForgingAllowed(networkState, delegate);
            expect(canForge).toBeFalse();
        });
    });
});
