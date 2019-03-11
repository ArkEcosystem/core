import { generators } from "@arkecosystem/core-test-utils";
import "jest-extended";

import { NetworkState, NetworkStateStatus } from "@arkecosystem/core-p2p";
import { Bignum, models } from "@arkecosystem/crypto";
import { testnet } from "../../crypto/src/networks";
import { defaults } from "../src/defaults";
import { ForgerManager } from "../src/manager";
import { sampleBlock } from "./__fixtures__/block";
import { delegate } from "./__fixtures__/delegate";
import { sampleTransaction } from "./__fixtures__/transaction";
import { setUp, tearDown } from "./__support__/setup";

const { Delegate, Transaction } = models;
const { generateTransfers } = generators;

jest.setTimeout(30000);
jest.mock("../src/client");

let forgeManager;

beforeAll(async () => {
    await setUp();
});

afterAll(async () => {
    await tearDown();
    jest.restoreAllMocks();
});

beforeEach(() => {
    defaults.hosts = [`http://127.0.0.1:4000`];
    forgeManager = new ForgerManager(defaults);
});

describe("Forger Manager", () => {
    describe("loadDelegates", () => {
        it("should be ok with configured delegates", async () => {
            const secret = "a secret";
            forgeManager.secrets = [secret];
            // @ts-ignore
            forgeManager.client.getUsernames.mockReturnValue([]);

            const delegates = await forgeManager.loadDelegates();

            expect(delegates).toBeArray();
            delegates.forEach(value => expect(value).toBeInstanceOf(Delegate));
            expect(forgeManager.client.getUsernames).toHaveBeenCalled();
        });
    });

    describe("__forgeNewBlock", () => {
        it("should forge a block", async () => {
            // NOTE: make sure we have valid transactions from an existing wallet
            const transactions = generateTransfers(
                "testnet",
                "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire",
            );

            // @ts-ignore
            forgeManager.client.getTransactions.mockReturnValue({
                transactions: transactions.map(tx => tx.serialized),
            });

            forgeManager.usernames = [];

            const del = new Delegate("a secret", testnet.network);
            const round = {
                lastBlock: { id: sampleBlock.data.id, height: sampleBlock.data.height },
                timestamp: 1,
                reward: 2 * 1e8,
            };

            await forgeManager.__forgeNewBlock(del, round);

            expect(forgeManager.client.broadcast).toHaveBeenCalledWith(
                expect.objectContaining({
                    height: round.lastBlock.height + 1,
                    reward: round.reward,
                }),
            );
            expect(forgeManager.client.emitEvent).toHaveBeenCalledWith("block.forged", expect.any(Object));
            expect(forgeManager.client.emitEvent).toHaveBeenCalledWith("transaction.forged", expect.any(Object));
        });
    });

    describe("__monitor", () => {
        it("should emit failed event if error while monitoring", async () => {
            forgeManager.client.getUsernames.mockRejectedValue(new Error("oh bollocks"));

            setTimeout(() => forgeManager.stop(), 1000);
            await forgeManager.__monitor();

            expect(forgeManager.client.emitEvent).toHaveBeenCalledWith("forger.failed", "oh bollocks");
        });
    });

    describe("__getTransactionsForForging", () => {
        it("should return zero transactions if none to forge", async () => {
            // @ts-ignore
            forgeManager.client.getTransactions.mockReturnValue({});

            const transactions = await forgeManager.__getTransactionsForForging();

            expect(transactions).toHaveLength(0);
            expect(forgeManager.client.getTransactions).toHaveBeenCalled();
        });
        it("should return deserialized transactions", async () => {
            // @ts-ignore
            forgeManager.client.getTransactions.mockReturnValue({
                transactions: [Transaction.serialize(sampleTransaction).toString("hex")],
            });

            const transactions = await forgeManager.__getTransactionsForForging();

            expect(transactions).toHaveLength(1);
            expect(forgeManager.client.getTransactions).toHaveBeenCalled();
            expect(transactions[0]).toBeInstanceOf(Transaction);
            expect(transactions[0].data.recipientId).toEqual(sampleTransaction.data.recipientId);
            expect(transactions[0].data.senderPublicKey).toEqual(sampleTransaction.data.senderPublicKey);
        });
    });

    describe("__isDelegateActivated", () => {
        it("should be ok", async () => {
            forgeManager.delegates = [
                {
                    username: "arkxdev",
                    publicKey: "0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0",
                },
            ];

            const forger = await forgeManager.__isDelegateActivated(
                "0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0",
            );

            expect(forger).toBeObject();
            expect(forger.username).toBe("arkxdev");
            expect(forger.publicKey).toBe("0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0");
        });
    });

    describe("__parseNetworkState", () => {
        it("should be TRUE when quorum > 0.66", async () => {
            const networkState = new NetworkState(NetworkStateStatus.Default);
            Object.assign(networkState, { getQuorum: () => 0.9, nodeHeight: 100, lastBlockId: "1233443" });

            const canForge = await forgeManager.__parseNetworkState(networkState, delegate);

            expect(canForge).toBeTrue();
        });

        it("should be FALSE when unknown", async () => {
            const networkState = new NetworkState(NetworkStateStatus.Unknown);
            Object.assign(networkState, { getQuorum: () => 1, nodeHeight: 100, lastBlockId: "1233443" });

            const canForge = await forgeManager.__parseNetworkState(networkState, delegate);

            expect(canForge).toBeFalse();
        });

        it("should be FALSE when quorum < 0.66", async () => {
            const networkState = new NetworkState(NetworkStateStatus.Default);
            Object.assign(networkState, { getQuorum: () => 0.65, nodeHeight: 100, lastBlockId: "1233443" });

            const canForge = await forgeManager.__parseNetworkState(networkState, delegate);

            expect(canForge).toBeFalse();
        });

        it("should be FALSE when coldStart is active", async () => {
            const networkState = new NetworkState(NetworkStateStatus.ColdStart);
            const canForge = await forgeManager.__parseNetworkState(networkState, delegate);

            expect(canForge).toBeFalse();
        });

        it("should be FALSE when minimumNetworkReach is not sufficient", async () => {
            const networkState = new NetworkState(NetworkStateStatus.BelowMinimumPeers);
            const canForge = await forgeManager.__parseNetworkState(networkState, delegate);

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

            const canForge = await forgeManager.__parseNetworkState(networkState, delegate);
            expect(canForge).toBeFalse();
        });
    });
});
