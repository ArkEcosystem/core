import "jest-extended";

import { ForgeNewBlockAction, IsForgingAllowedAction } from "@packages/core-forger/src/actions";
import { Contracts } from "@packages/core-kernel";
import { Sandbox } from "@packages/core-test-framework";
import { Interfaces } from "@packages/crypto";
import { Slots } from "@packages/crypto/dist/crypto";
import { HostNoResponseError, RelayCommunicationError } from "@packages/core-forger/src/errors";
import { ForgerService } from "@packages/core-forger/src/forger-service";
import { Container, Enums, Services, Utils } from "@packages/core-kernel";
import { NetworkStateStatus } from "@packages/core-p2p";
import { GetActiveDelegatesAction } from "@packages/core-state/src/actions";
import { Crypto, Managers } from "@packages/crypto";
import { Address } from "@packages/crypto/src/identities";
import { BuilderFactory } from "@packages/crypto/src/transactions";

import { calculateActiveDelegates } from "./__utils__/calculate-active-delegates";

let sandbox: Sandbox;

const logger = {
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
};

const client = {
    register: jest.fn(),
    dispose: jest.fn(),
    broadcastBlock: jest.fn(),
    syncWithNetwork: jest.fn(),
    getRound: jest.fn(),
    getNetworkState: jest.fn(),
    getTransactions: jest.fn(),
    emitEvent: jest.fn(),
    selectHost: jest.fn(),
};

const handlerProvider = {
    isRegistrationRequired: jest.fn(),
    registerHandlers: jest.fn(),
};

beforeEach(() => {
    sandbox = new Sandbox();
    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);
    sandbox.app.bind(Container.Identifiers.TransactionHandlerProvider).toConstantValue(handlerProvider);

    sandbox.app.bind(Container.Identifiers.TriggerService).to(Services.Triggers.Triggers).inSingletonScope();

    sandbox.app
        .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
        .bind("getActiveDelegates", new GetActiveDelegatesAction(sandbox.app));

    sandbox.app
        .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
        .bind("forgeNewBlock", new ForgeNewBlockAction());

    sandbox.app
        .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
        .bind("isForgingAllowed", new IsForgingAllowedAction());

    const getTimeStampForBlock = (height: number) => {
        switch (height) {
            case 1:
                return 0;
            default:
                throw new Error(`Test scenarios should not hit this line`);
        }
    };

    jest.spyOn(Utils.forgingInfoCalculator, "getBlockTimeLookup").mockResolvedValue(getTimeStampForBlock);
});

afterEach(() => {
    jest.resetAllMocks();
});

describe("ForgerService", () => {
    let forgerService: ForgerService;
    const mockHost = { hostname: "127.0.0.1", port: 4000 };
    let delegates;
    let mockNetworkState;
    let mockTransaction;
    let transaction;
    let mockRound;
    let round;

    beforeEach(() => {
        forgerService = sandbox.app.resolve<ForgerService>(ForgerService);

        jest.spyOn(sandbox.app, "resolve").mockReturnValueOnce(client); // forger-service only resolves Client

        const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
        slotSpy.mockReturnValue(0);

        delegates = calculateActiveDelegates();

        round = {
            data: {
                delegates,
                timestamp: Slots.getTime() - 3,
                reward: 0,
                lastBlock: { height: 100 },
            },
            canForge: false,
        };

        mockNetworkState = {
            status: NetworkStateStatus.Default,
            getNodeHeight: () => 10,
            getLastBlockId: () => "11111111",
            getOverHeightBlockHeaders: () => [],
            getQuorum: () => 0.7,
            toJson: () => "test json",
        };

        const recipientAddress = Address.fromPassphrase("recipient's secret");
        transaction = BuilderFactory.transfer()
            .version(1)
            .amount("100")
            .recipientId(recipientAddress)
            .sign("sender's secret")
            .build();

        mockTransaction = {
            transactions: [transaction.serialized.toString("hex")],
            poolSize: 10,
            count: 10,
        };

        mockRound = {
            timestamp: Slots.getTime() - 5,
            reward: 0,
            lastBlock: { height: 100 },
        };
    });

    describe("GetRound", () => {
        it("should return undefined", () => {
            forgerService.register({ hosts: [mockHost] });

            expect(forgerService.getRound()).toBeUndefined();
        });
    });

    describe("GetRemainingSlotTime", () => {
        it("should return undefined", () => {
            forgerService.register({ hosts: [mockHost] });

            expect(forgerService.getRemainingSlotTime()).toBeUndefined();
        });
    });

    describe("GetLastForgedBlock", () => {
        it("should return undefined", () => {
            forgerService.register({ hosts: [mockHost] });

            expect(forgerService.getLastForgedBlock()).toBeUndefined();
        });
    });

    describe("Register", () => {
        it("should register an associated client", async () => {
            forgerService.register({ hosts: [mockHost] });

            expect(client.register).toBeCalledTimes(1);
            expect(client.register).toBeCalledWith([mockHost]);
        });
    });

    describe("Dispose", () => {
        it("should dispose of an associated client", async () => {
            forgerService.register({ hosts: [mockHost] });
            const spyDisposeClient = jest.spyOn((forgerService as any).client, "dispose");
            // @ts-ignore
            expect(forgerService.isStopped).toEqual(false);
            forgerService.dispose();
            expect(spyDisposeClient).toHaveBeenCalled();
            // @ts-ignore
            expect(forgerService.isStopped).toEqual(true);
        });
    });

    describe("Boot", () => {
        it("should register handlers, set delegates, and log active delegates info message", async () => {
            handlerProvider.isRegistrationRequired.mockReturnValue(true);

            forgerService.register({ hosts: [mockHost] });
            client.getRound.mockReturnValueOnce({ delegates });

            await expect(forgerService.boot(delegates)).toResolve();

            expect((forgerService as any).delegates).toEqual(delegates);

            const expectedInfoMessage = `Loaded ${Utils.pluralize(
                "active delegate",
                delegates.length,
                true,
            )}: ${delegates.map((wallet) => `${wallet.delegate.username} (${wallet.publicKey})`).join(", ")}`;

            expect(handlerProvider.registerHandlers).toBeCalled();
            expect(logger.info).toHaveBeenCalledWith(expectedInfoMessage);
        });

        it("should skip logging when the service is already initialised", async () => {
            forgerService.register({ hosts: [mockHost] });
            client.getRound.mockReturnValueOnce({ delegates });
            (forgerService as any).initialized = true;

            await expect(forgerService.boot(delegates)).toResolve();
            expect(logger.info).not.toHaveBeenCalledWith(`Forger Manager started.`);
        });

        it("should not log when there are no active delegates", async () => {
            forgerService.register({ hosts: [mockHost] });
            client.getRound.mockReturnValueOnce({ delegates });

            await expect(forgerService.boot([])).toResolve();
            expect(logger.info).toHaveBeenCalledTimes(1);
            expect(logger.info).toHaveBeenCalledWith(`Forger Manager started.`);
        });

        it("should log inactive delegates correctly", async () => {
            const numberActive = 10;

            const round = { data: { delegates: delegates.slice(0, numberActive) } };

            client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

            const expectedInactiveDelegatesMessage = `Loaded ${Utils.pluralize(
                "inactive delegate",
                delegates.length - numberActive,
                true,
            )}: ${delegates
                .slice(numberActive)
                .map((delegate) => delegate.publicKey)
                .join(", ")}`;

            forgerService.register({ hosts: [mockHost] });
            await expect(forgerService.boot(delegates)).toResolve();

            expect(logger.info).toHaveBeenCalledWith(expectedInactiveDelegatesMessage);
        });

        it("should catch and log errors", async () => {
            client.getRound.mockRejectedValueOnce(new Error("oops"));

            forgerService.register({ hosts: [mockHost] });
            await expect(forgerService.boot(delegates)).toResolve();

            expect(logger.warning).toHaveBeenCalledWith(`Waiting for a responsive host`);
        });

        it("should set correct timeout to check slots", async () => {
            jest.useFakeTimers();

            client.getRound.mockReturnValueOnce({
                delegates,
                timestamp: Crypto.Slots.getTime() - 7,
                lastBlock: { height: 100 },
            });

            forgerService.register({ hosts: [mockHost] });
            await expect(forgerService.boot(delegates)).toResolve();

            jest.runAllTimers();

            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), expect.toBeWithin(0, 2000));
        });
    });

    describe("GetTransactionsForForging", () => {
        it("should log error when transactions are empty", async () => {
            forgerService.register({ hosts: [mockHost] });

            // @ts-ignore
            const spyGetTransactions = jest.spyOn(forgerService.client, "getTransactions");
            // @ts-ignore
            spyGetTransactions.mockResolvedValue([]);
            await expect(forgerService.getTransactionsForForging()).resolves.toEqual([]);
            expect(logger.error).toHaveBeenCalledWith(`Could not get unconfirmed transactions from transaction pool.`);
        });

        it("should log and return valid transactions", async () => {
            forgerService.register({ hosts: [mockHost] });

            // @ts-ignore
            const spyGetTransactions = jest.spyOn(forgerService.client, "getTransactions");

            const recipientAddress = Address.fromPassphrase("recipient's secret");
            const transaction = BuilderFactory.transfer()
                .version(1)
                .amount("100")
                .recipientId(recipientAddress)
                .sign("sender's secret")
                .build();

            const mockTransaction = {
                transactions: [transaction.serialized.toString("hex")],
                poolSize: 10,
                count: 10,
            };
            // @ts-ignore
            spyGetTransactions.mockResolvedValue(mockTransaction);
            await expect(forgerService.getTransactionsForForging()).resolves.toEqual([transaction.data]);
            expect(logger.error).not.toHaveBeenCalled();
            const expectedLogInfo =
                `Received ${Utils.pluralize("transaction", 1, true)} ` +
                `from the pool containing ${Utils.pluralize("transaction", mockTransaction.poolSize, true)} total`;
            expect(logger.debug).toHaveBeenCalledWith(expectedLogInfo);
        });
    });

    describe("isForgingAllowed", () => {
        it("should not allow forging when network status is unknown", async () => {
            expect(
                // @ts-ignore
                forgerService.isForgingAllowed({ status: NetworkStateStatus.Unknown }, delegates[0]),
            ).toEqual(false);
            expect(logger.info).toHaveBeenCalledWith("Failed to get network state from client. Will not forge.");
        });

        it("should not allow forging when network status is a cold start", async () => {
            expect(
                // @ts-ignore
                forgerService.isForgingAllowed({ status: NetworkStateStatus.ColdStart }, delegates[0]),
            ).toEqual(false);
            expect(logger.info).toHaveBeenCalledWith("Skipping slot because of cold start. Will not forge.");
        });

        it("should not allow forging when network status is below minimum peers", async () => {
            expect(
                // @ts-ignore
                forgerService.isForgingAllowed({ status: NetworkStateStatus.BelowMinimumPeers }, delegates[0]),
            ).toEqual(false);
            expect(logger.info).toHaveBeenCalledWith("Network reach is not sufficient to get quorum. Will not forge.");
        });

        it("should log double forge warning for any overheight block headers", async () => {
            client.getRound.mockReturnValueOnce({ delegates });
            forgerService.register({ hosts: [mockHost] });
            await forgerService.boot(delegates);

            const overHeightBlockHeaders: Array<{
                [id: string]: any;
            }> = [
                {
                    generatorPublicKey: delegates[0].publicKey,
                    id: 1,
                },
            ];

            mockNetworkState.getQuorum = () => 0.99;
            mockNetworkState.getOverHeightBlockHeaders = () => overHeightBlockHeaders;

            expect(
                // @ts-ignore
                forgerService.isForgingAllowed(mockNetworkState, delegates[0]),
            ).toEqual(true);
            const expectedOverHeightInfo = `Detected ${Utils.pluralize(
                "distinct overheight block header",
                overHeightBlockHeaders.length,
                true,
            )}.`;
            expect(logger.info).toHaveBeenCalledWith(expectedOverHeightInfo);

            const expectedDoubleForgeWarning = `Possible double forging delegate: ${delegates[0].delegate.username} (${delegates[0].publicKey}) - Block: ${overHeightBlockHeaders[0].id}.`;

            expect(logger.warning).toHaveBeenCalledWith(expectedDoubleForgeWarning);
        });

        it("should not allow forging if quorum is not met", async () => {
            jest.useFakeTimers();

            client.getRound.mockReturnValueOnce({
                delegates,
                timestamp: Crypto.Slots.getTime() - 7,
                lastBlock: { height: 100 },
            });

            forgerService.register({ hosts: [mockHost] });
            await forgerService.boot(delegates);

            (mockNetworkState.getQuorum = () => 0.6),
                expect(
                    // @ts-ignore
                    forgerService.isForgingAllowed(mockNetworkState, delegates[0]),
                ).toEqual(false);

            expect(logger.info).toHaveBeenCalledWith("Not enough quorum to forge next block. Will not forge.");

            expect(logger.debug).toHaveBeenCalledWith(`Network State: ${mockNetworkState.toJson()}`);

            expect(logger.warning).not.toHaveBeenCalled();
        });

        it("should allow forging if quorum is met", async () => {
            client.getRound.mockReturnValueOnce({
                delegates,
                timestamp: Crypto.Slots.getTime() - 7,
                lastBlock: { height: 100 },
            });

            forgerService.register({ hosts: [mockHost] });
            await forgerService.boot(delegates);

            expect(
                // @ts-ignore
                forgerService.isForgingAllowed(mockNetworkState, delegates[0]),
            ).toEqual(true);

            expect(logger.debug).not.toHaveBeenCalled();

            expect(logger.warning).not.toHaveBeenCalled();
        });

        it("should allow forging if quorum is met, not log warning if overheight delegate is not the same", async () => {
            client.getRound.mockReturnValueOnce({
                delegates,
                timestamp: Crypto.Slots.getTime() - 7,
                lastBlock: { height: 100 },
            });

            forgerService.register({ hosts: [mockHost] });
            await forgerService.boot(delegates);

            const overHeightBlockHeaders: Array<{
                [id: string]: any;
            }> = [
                {
                    generatorPublicKey: delegates[0].publicKey,
                    id: 1,
                },
            ];

            mockNetworkState.getOverHeightBlockHeaders = () => overHeightBlockHeaders;

            expect(
                // @ts-ignore
                forgerService.isForgingAllowed(mockNetworkState, delegates[1]),
            ).toEqual(true);

            expect(logger.debug).not.toHaveBeenCalled();

            expect(logger.warning).not.toHaveBeenCalled();
        });
    });

    describe("checkSlot", () => {
        it("should do nothing when the forging service is stopped", async () => {
            forgerService.register({ hosts: [mockHost] });

            await forgerService.dispose();

            await expect(forgerService.checkSlot()).toResolve();

            expect(logger.info).not.toHaveBeenCalled();
            expect(logger.warning).not.toHaveBeenCalled();
            expect(logger.error).not.toHaveBeenCalled();
            expect(logger.debug).not.toHaveBeenCalled();
        });

        it("should set timer if forging is not yet allowed", async () => {
            forgerService.register({ hosts: [mockHost] });
            (forgerService as any).initialized = true;

            client.getRound.mockReturnValueOnce({
                delegates,
                timestamp: Crypto.Slots.getTime() - 7,
                lastBlock: { height: 100 },
            });
            await expect(forgerService.boot(delegates)).toResolve();
            expect(logger.info).not.toHaveBeenCalledWith(`Forger Manager started.`);

            jest.useFakeTimers();

            client.getRound.mockReturnValueOnce({
                delegates,
                timestamp: Crypto.Slots.getTime() - 7,
                lastBlock: { height: 100 },
            });
            await expect(forgerService.checkSlot()).toResolve();
            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 200);

            expect(logger.info).not.toHaveBeenCalled();
            expect(logger.warning).not.toHaveBeenCalled();
            expect(logger.error).not.toHaveBeenCalled();
            expect(logger.debug).not.toHaveBeenCalled();

            jest.useRealTimers();
        });

        it("should set timer and log nextForger which is active on node", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const round = {
                data: {
                    delegates,
                    canForge: true,
                    currentForger: {
                        publicKey: delegates[delegates.length - 1].publicKey,
                    },
                    nextForger: { publicKey: delegates[delegates.length - 3].publicKey },
                    timestamp: Crypto.Slots.getTime() - 7,
                    lastBlock: { height: 100 },
                },
            };

            client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

            forgerService.register({ hosts: [mockHost] });
            (forgerService as any).initialized = true;

            await expect(forgerService.boot(delegates.slice(0, delegates.length - 2))).toResolve();
            expect(logger.info).not.toHaveBeenCalledWith(`Forger Manager started.`);

            jest.useFakeTimers();
            // @ts-ignore
            const spyClientSyncWithNetwork = jest.spyOn(forgerService.client, "syncWithNetwork");

            client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);
            await expect(forgerService.checkSlot()).toResolve();

            expect(spyClientSyncWithNetwork).toHaveBeenCalled();

            const expectedInfoMessage = `Next forging delegate ${delegates[delegates.length - 3].delegate.username} (${
                delegates[delegates.length - 3].publicKey
            }) is active on this node.`;

            expect(logger.info).toHaveBeenCalledWith(expectedInfoMessage);
            expect(logger.warning).not.toHaveBeenCalled();
            expect(logger.error).not.toHaveBeenCalled();

            jest.useRealTimers();
        });

        it("should set timer and not log message if nextForger is not active", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const round = {
                data: {
                    delegates,
                    canForge: true,
                    currentForger: {
                        publicKey: delegates[delegates.length - 2].publicKey,
                    },
                    nextForger: { publicKey: delegates[delegates.length - 1].publicKey },
                    timestamp: Crypto.Slots.getTime() - 7,
                    lastBlock: { height: 100 },
                },
            };

            client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

            forgerService.register({ hosts: [mockHost] });
            (forgerService as any).initialized = true;

            await expect(forgerService.boot(delegates.slice(0, delegates.length - 3))).toResolve();
            expect(logger.info).not.toHaveBeenCalledWith(`Forger Manager started.`);

            jest.useFakeTimers();
            // @ts-ignore
            const spyClientSyncWithNetwork = jest.spyOn(forgerService.client, "syncWithNetwork");
            spyClientSyncWithNetwork.mockReset();

            client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);
            await expect(forgerService.checkSlot()).toResolve();

            expect(spyClientSyncWithNetwork).not.toHaveBeenCalled();

            const expectedInfoMessage = `Next forging delegate ${delegates[delegates.length - 3].delegate.username} (${
                delegates[delegates.length - 3].publicKey
            }) is active on this node.`;

            expect(logger.info).not.toHaveBeenCalledWith(expectedInfoMessage);
            expect(logger.warning).not.toHaveBeenCalled();
            expect(logger.error).not.toHaveBeenCalled();
            expect(logger.debug).not.toHaveBeenCalledWith(`Sending wake-up check to relay node ${mockHost.hostname}`);

            jest.useRealTimers();
        });

        it("should forge valid blocks when forging is allowed", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const mockBlock = { data: {} } as Interfaces.IBlock;
            const nextDelegateToForge = {
                publicKey: delegates[2].publicKey,
                forge: jest.fn().mockReturnValue(mockBlock),
            };
            delegates[delegates.length - 2] = Object.assign(nextDelegateToForge, delegates[delegates.length - 2]);

            const round = {
                data: {
                    delegates,
                    canForge: true,
                    currentForger: {
                        publicKey: delegates[delegates.length - 2].publicKey,
                    },
                    nextForger: { publicKey: delegates[delegates.length - 3].publicKey },
                    lastBlock: {
                        height: 3,
                    },
                    timestamp: Crypto.Slots.getTime() - 7,
                    reward: "0",
                    current: 1,
                },
            };

            client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

            forgerService.register({ hosts: [mockHost] });

            // @ts-ignore
            const spyGetTransactions = jest.spyOn(forgerService.client, "getTransactions");
            // @ts-ignore
            spyGetTransactions.mockResolvedValue([]);

            const spyForgeNewBlock = jest.spyOn(forgerService, "forgeNewBlock");

            // @ts-ignore
            const spyGetNetworkState = jest.spyOn(forgerService.client, "getNetworkState");
            // @ts-ignore
            spyGetNetworkState.mockResolvedValue(mockNetworkState);

            await expect(forgerService.boot(delegates)).toResolve();

            client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);
            jest.useFakeTimers();
            // @ts-ignore
            await expect(forgerService.checkSlot()).toResolve();

            expect(spyForgeNewBlock).toHaveBeenCalledWith(
                delegates[delegates.length - 2],
                round.data,
                mockNetworkState,
            );

            const loggerWarningMessage = `The NetworkState height (${mockNetworkState.getNodeHeight()}) and round height (${
                round.data.lastBlock.height
            }) are out of sync. This indicates delayed blocks on the network.`;
            expect(logger.warning).toHaveBeenCalledWith(loggerWarningMessage);

            jest.useRealTimers();
        });

        it("should not log warning message when nodeHeight does not equal last block height", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const mockBlock = { data: {} } as Interfaces.IBlock;
            const nextDelegateToForge = {
                publicKey: delegates[2].publicKey,
                forge: jest.fn().mockReturnValue(mockBlock),
            };
            delegates[delegates.length - 2] = Object.assign(nextDelegateToForge, delegates[delegates.length - 2]);

            const round = {
                data: {
                    delegates,
                    canForge: true,
                    currentForger: {
                        publicKey: delegates[delegates.length - 2].publicKey,
                    },
                    nextForger: { publicKey: delegates[delegates.length - 3].publicKey },
                    lastBlock: {
                        height: 10,
                    },
                    timestamp: Crypto.Slots.getTime() - 7,
                    reward: "0",
                },
            };

            client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

            forgerService.register({ hosts: [mockHost] });

            // @ts-ignore
            const spyGetTransactions = jest.spyOn(forgerService.client, "getTransactions");
            // @ts-ignore
            spyGetTransactions.mockResolvedValue([]);

            const spyForgeNewBlock = jest.spyOn(forgerService, "forgeNewBlock");

            // @ts-ignore
            const spyGetNetworkState = jest.spyOn(forgerService.client, "getNetworkState");
            // @ts-ignore
            spyGetNetworkState.mockResolvedValue(mockNetworkState);

            await expect(forgerService.boot(delegates)).toResolve();

            client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);
            jest.useFakeTimers();
            // @ts-ignore
            await forgerService.checkSlot();

            expect(spyForgeNewBlock).toHaveBeenCalledWith(
                delegates[delegates.length - 2],
                round.data,
                mockNetworkState,
            );

            const loggerWarningMessage = `The NetworkState height (${mockNetworkState.nodeHeight}) and round height (${round.data.lastBlock.height}) are out of sync. This indicates delayed blocks on the network.`;
            expect(logger.warning).not.toHaveBeenCalledWith(loggerWarningMessage);

            jest.useRealTimers();
        });

        it("should not allow forging when blocked by network status", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const mockBlock = { data: {} } as Interfaces.IBlock;
            const nextDelegateToForge = {
                publicKey: delegates[2].publicKey,
                forge: jest.fn().mockReturnValue(mockBlock),
            };
            delegates[delegates.length - 2] = Object.assign(nextDelegateToForge, delegates[delegates.length - 2]);

            const round = {
                data: {
                    delegates,
                    canForge: true,
                    currentForger: {
                        publicKey: delegates[delegates.length - 2].publicKey,
                    },
                    nextForger: { publicKey: delegates[delegates.length - 3].publicKey },
                    lastBlock: {
                        height: 10,
                    },
                    timestamp: 0,
                    reward: "0",
                },
            };

            client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

            forgerService.register({ hosts: [mockHost] });

            // @ts-ignore
            const spyGetTransactions = jest.spyOn(forgerService.client, "getTransactions");
            // @ts-ignore
            spyGetTransactions.mockResolvedValue([]);

            const spyForgeNewBlock = jest.spyOn(forgerService, "forgeNewBlock");

            mockNetworkState.status = NetworkStateStatus.Unknown;

            // @ts-ignore
            const spyGetNetworkState = jest.spyOn(forgerService.client, "getNetworkState");
            // @ts-ignore
            spyGetNetworkState.mockResolvedValue(mockNetworkState);

            await expect(forgerService.boot(delegates)).toResolve();

            client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);
            // @ts-ignore
            await expect(forgerService.checkSlot()).toResolve();

            expect(spyForgeNewBlock).not.toHaveBeenCalled();
        });

        it("should catch network errors and set timeout to check slot later", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const mockBlock = { data: {} } as Interfaces.IBlock;
            const nextDelegateToForge = {
                publicKey: delegates[2].publicKey,
                forge: jest.fn().mockReturnValue(mockBlock),
            };
            delegates[delegates.length - 2] = Object.assign(nextDelegateToForge, delegates[delegates.length - 2]);

            const round = {
                data: {
                    delegates,
                    canForge: true,
                    currentForger: {
                        publicKey: delegates[delegates.length - 2].publicKey,
                    },
                    nextForger: { publicKey: delegates[delegates.length - 3].publicKey },
                    lastBlock: {
                        height: 10,
                    },
                    timestamp: 0,
                    reward: "0",
                },
            };

            client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

            forgerService.register({ hosts: [mockHost] });

            // @ts-ignore
            const spyGetTransactions = jest.spyOn(forgerService.client, "getTransactions");
            // @ts-ignore
            spyGetTransactions.mockResolvedValue([]);

            const spyForgeNewBlock = jest.spyOn(forgerService, "forgeNewBlock");

            // @ts-ignore
            const spyGetNetworkState = jest.spyOn(forgerService.client, "getNetworkState");
            // @ts-ignore
            spyGetNetworkState.mockImplementation(() => {
                throw new HostNoResponseError(`blockchain isn't ready`);
            });

            await expect(forgerService.boot(delegates)).toResolve();

            client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);
            jest.useFakeTimers();
            // @ts-ignore
            await expect(forgerService.checkSlot()).toResolve();

            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);

            expect(spyForgeNewBlock).not.toHaveBeenCalled();

            expect(logger.info).toHaveBeenCalledWith(`Waiting for relay to become ready.`);

            jest.useRealTimers();
        });

        it("should log warning when error isn't a network error", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const mockBlock = { data: {} } as Interfaces.IBlock;
            const nextDelegateToForge = {
                publicKey: delegates[2].publicKey,
                forge: jest.fn().mockReturnValue(mockBlock),
            };
            delegates[delegates.length - 2] = Object.assign(nextDelegateToForge, delegates[delegates.length - 2]);

            const round = {
                data: {
                    delegates,
                    canForge: true,
                    currentForger: {
                        publicKey: delegates[delegates.length - 2].publicKey,
                    },
                    nextForger: { publicKey: delegates[delegates.length - 3].publicKey },
                    lastBlock: {
                        height: 10,
                    },
                    timestamp: 0,
                    reward: "0",
                },
            };

            client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

            forgerService.register({ hosts: [mockHost] });

            // @ts-ignore
            const spyGetTransactions = jest.spyOn(forgerService.client, "getTransactions");
            // @ts-ignore
            spyGetTransactions.mockResolvedValue([]);

            const spyForgeNewBlock = jest.spyOn(forgerService, "forgeNewBlock");

            // @ts-ignore
            const spyGetNetworkState = jest.spyOn(forgerService.client, "getNetworkState");
            const mockEndpoint = `Test - Endpoint`;
            const mockError = `custom error`;
            // @ts-ignore
            spyGetNetworkState.mockImplementation(() => {
                throw new RelayCommunicationError(mockEndpoint, mockError);
            });

            await expect(forgerService.boot(delegates)).toResolve();

            client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);
            jest.useFakeTimers();
            // @ts-ignore
            await expect(forgerService.checkSlot()).toResolve();

            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);

            expect(spyForgeNewBlock).not.toHaveBeenCalled();

            expect(logger.warning).toHaveBeenCalledWith(
                `Request to ${mockEndpoint} failed, because of '${mockError}'.`,
            );

            jest.useRealTimers();
        });

        it("should log error when error thrown during attempted forge isn't a network error", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const mockBlock = { data: {} } as Interfaces.IBlock;
            const nextDelegateToForge = {
                publicKey: delegates[2].publicKey,
                forge: jest.fn().mockReturnValue(mockBlock),
            };
            delegates[delegates.length - 2] = Object.assign(nextDelegateToForge, delegates[delegates.length - 2]);

            const round = {
                data: {
                    delegates,
                    canForge: true,
                    currentForger: {
                        publicKey: delegates[delegates.length - 2].publicKey,
                    },
                    nextForger: { publicKey: delegates[delegates.length - 3].publicKey },
                    lastBlock: {
                        height: 10,
                    },
                    timestamp: 0,
                    reward: "0",
                    current: 9,
                },
            };

            client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);

            forgerService.register({ hosts: [mockHost] });

            // @ts-ignore
            const spyGetTransactions = jest.spyOn(forgerService.client, "getTransactions");
            // @ts-ignore
            spyGetTransactions.mockResolvedValue([]);

            // @ts-ignore
            const spyClientEmitEvent = jest.spyOn(forgerService.client, "emitEvent");

            const spyForgeNewBlock = jest.spyOn(forgerService, "forgeNewBlock");

            // @ts-ignore
            const spyGetNetworkState = jest.spyOn(forgerService.client, "getNetworkState");
            const mockError = `custom error`;
            // @ts-ignore
            spyGetNetworkState.mockImplementation(() => {
                throw new Error(mockError);
            });

            await expect(forgerService.boot(delegates)).toResolve();

            client.getRound.mockResolvedValueOnce(round.data as Contracts.P2P.CurrentRound);
            jest.useFakeTimers();
            // @ts-ignore
            await expect(forgerService.checkSlot()).toResolve();

            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);

            expect(spyForgeNewBlock).not.toHaveBeenCalled();

            expect(logger.error).toHaveBeenCalled();

            expect(spyClientEmitEvent).toHaveBeenCalledWith(Enums.ForgerEvent.Failed, { error: mockError });
            const infoMessage = `Round: ${round.data.current.toLocaleString()}, height: ${round.data.lastBlock.height.toLocaleString()}`;
            expect(logger.info).toHaveBeenCalledWith(infoMessage);

            jest.useRealTimers();
        });

        it("should not error when there is no round info", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const mockBlock = { data: {} } as Interfaces.IBlock;
            const nextDelegateToForge = {
                publicKey: delegates[2].publicKey,
                forge: jest.fn().mockReturnValue(mockBlock),
            };
            delegates[delegates.length - 2] = Object.assign(nextDelegateToForge, delegates[delegates.length - 2]);

            const round = undefined;

            client.getRound.mockResolvedValueOnce(round as Contracts.P2P.CurrentRound);

            forgerService.register({ hosts: [mockHost] });

            // @ts-ignore
            const spyGetTransactions = jest.spyOn(forgerService.client, "getTransactions");
            // @ts-ignore
            spyGetTransactions.mockResolvedValue([]);

            // @ts-ignore
            const spyClientEmitEvent = jest.spyOn(forgerService.client, "emitEvent");

            const spyForgeNewBlock = jest.spyOn(forgerService, "forgeNewBlock");

            await expect(forgerService.boot(delegates)).toResolve();

            client.getRound.mockResolvedValueOnce(round as Contracts.P2P.CurrentRound);
            jest.useFakeTimers();
            // @ts-ignore
            await expect(forgerService.checkSlot()).toResolve();

            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);

            expect(spyForgeNewBlock).not.toHaveBeenCalled();

            expect(logger.error).toHaveBeenCalled();

            expect(spyClientEmitEvent).toHaveBeenCalledWith(Enums.ForgerEvent.Failed, { error: expect.any(String) });
            expect(logger.info).not.toHaveBeenCalled();

            jest.useRealTimers();
        });
    });

    describe("ForgeNewBlock", () => {
        it("should fail to forge when delegate is already in next slot", async () => {
            client.getRound.mockReturnValueOnce({
                delegates,
                timestamp: Crypto.Slots.getTime() - 7,
                lastBlock: { height: 100 },
            });

            forgerService.register({ hosts: [mockHost] });

            client.getTransactions.mockResolvedValueOnce(mockTransaction);

            await forgerService.boot(delegates);

            const address = `Delegate-Wallet-${2}`;

            const mockBlock = { data: {} } as Interfaces.IBlock;
            const mockPrevRound = { ...mockRound, timestamp: Slots.getTime() - 9 };
            const nextDelegateToForge = {
                publicKey: delegates[2].publicKey,
                forge: jest.fn().mockReturnValue(mockBlock),
            };

            // @ts-ignore
            await expect(forgerService.forgeNewBlock(nextDelegateToForge, mockPrevRound, mockNetworkState)).toResolve();

            const prettyName = `Username: ${address} (${nextDelegateToForge.publicKey})`;

            const failedForgeMessage = `Failed to forge new block by delegate ${prettyName}, because already in next slot.`;

            expect(logger.warning).toHaveBeenCalledWith(failedForgeMessage);
        });

        it("should fail to forge when there is not enough time left in slot", async () => {
            client.getRound.mockReturnValueOnce({
                delegates,
                timestamp: Crypto.Slots.getTime() - 7,
                lastBlock: { height: 100 },
            });

            forgerService.register({ hosts: [mockHost] });

            client.getTransactions.mockResolvedValueOnce(mockTransaction);

            await forgerService.boot(delegates);

            const address = `Delegate-Wallet-${2}`;

            const mockBlock = { data: {} } as Interfaces.IBlock;
            const mockEndingRound = { ...mockRound, timestamp: Slots.getTime() - 7 };
            const nextDelegateToForge = {
                publicKey: delegates[2].publicKey,
                forge: jest.fn().mockReturnValue(mockBlock),
            };

            const spyNextSlot = jest.spyOn(Crypto.Slots, "getSlotNumber");
            spyNextSlot.mockReturnValue(0);

            // @ts-ignore
            await expect(
                forgerService.forgeNewBlock(nextDelegateToForge as any, mockEndingRound, mockNetworkState),
            ).toResolve();

            const prettyName = `Username: ${address} (${nextDelegateToForge.publicKey})`;

            expect(logger.warning).toHaveBeenCalledWith(
                expect.stringContaining(`Failed to forge new block by delegate ${prettyName}, because there were`),
            );
        });

        it("should forge valid new blocks", async () => {
            client.getRound.mockReturnValueOnce({ delegates });
            const timeLeftInMs = 3000;
            const spyTimeTillNextSlot = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            spyTimeTillNextSlot.mockReturnValue(timeLeftInMs);

            forgerService.register({ hosts: [mockHost] });

            client.getTransactions.mockResolvedValueOnce(mockTransaction);

            await forgerService.boot(delegates);

            const address = `Delegate-Wallet-${2}`;

            const mockBlock = { data: {} } as Interfaces.IBlock;
            const nextDelegateToForge = {
                publicKey: delegates[2].publicKey,
                forge: jest.fn().mockReturnValue(mockBlock),
            };

            const spyNextSlot = jest.spyOn(Crypto.Slots, "getSlotNumber");
            spyNextSlot.mockReturnValue(0);

            client.emitEvent.mockReset();
            // @ts-ignore
            await expect(forgerService.forgeNewBlock(nextDelegateToForge, mockRound, mockNetworkState)).toResolve();

            const prettyName = `Username: ${address} (${nextDelegateToForge.publicKey})`;

            const infoForgeMessageOne = `Forged new block`;
            const infoForgeMessageTwo = ` by delegate ${prettyName}`;

            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining(infoForgeMessageOne));
            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining(infoForgeMessageTwo));

            expect(client.broadcastBlock).toHaveBeenCalledWith(mockBlock);

            expect(client.emitEvent).toHaveBeenNthCalledWith(1, Enums.BlockEvent.Forged, expect.anything());

            expect(client.emitEvent).toHaveBeenNthCalledWith(2, Enums.TransactionEvent.Forged, transaction.data);
        });

        it("should forge valid new blocks when passed specific milestones", async () => {
            client.getRound.mockReturnValueOnce({
                delegates,
                timestamp: Crypto.Slots.getTime() - 3,
                lastBlock: { height: 100 },
            });

            const spyMilestone = jest.spyOn(Managers.configManager, "getMilestone");
            spyMilestone.mockReturnValue({
                ...Managers.configManager.getMilestone(1),
                block: { version: 0, idFullSha256: true },
            });

            forgerService.register({ hosts: [mockHost] });

            client.getTransactions.mockResolvedValueOnce(mockTransaction);

            mockNetworkState.lastBlockId = "c2fa2d400b4c823873d476f6e0c9e423cf925e9b48f1b5706c7e2771d4095538";

            jest.useFakeTimers();
            await forgerService.boot(delegates);

            const address = `Delegate-Wallet-${2}`;

            const mockBlock = { data: {} } as Interfaces.IBlock;
            const nextDelegateToForge = {
                publicKey: delegates[2].publicKey,
                forge: jest.fn().mockReturnValue(mockBlock),
            };

            const spyNextSlot = jest.spyOn(Crypto.Slots, "getSlotNumber");
            spyNextSlot.mockReturnValueOnce(0).mockReturnValueOnce(0);

            client.emitEvent.mockReset();
            // @ts-ignore
            await forgerService.forgeNewBlock(nextDelegateToForge, round.data, mockNetworkState);

            const prettyName = `Username: ${address} (${nextDelegateToForge.publicKey})`;

            const infoForgeMessageOne = `Forged new block`;
            const infoForgeMessageTwo = ` by delegate ${prettyName}`;

            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining(infoForgeMessageOne));
            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining(infoForgeMessageTwo));

            expect(client.broadcastBlock).toHaveBeenCalledWith(mockBlock);

            expect(client.emitEvent).toHaveBeenNthCalledWith(1, Enums.BlockEvent.Forged, expect.anything());

            expect(client.emitEvent).toHaveBeenNthCalledWith(2, Enums.TransactionEvent.Forged, transaction.data);
            jest.useRealTimers();
        });
    });
});
