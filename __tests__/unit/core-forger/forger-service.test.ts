import "jest-extended";

import { Client } from "@packages/core-forger/src/client";
import { ForgerService } from "@packages/core-forger/src/forger-service";
import { Application, Container, Utils } from "@packages/core-kernel";
import { NetworkStateStatus } from "@packages/core-p2p";
import { Wallet } from "@packages/core-state/src/wallets";
import { Crypto, Identities } from "@packages/crypto";
import { Address } from "@packages/crypto/src/identities";
import { BuilderFactory } from "@packages/crypto/src/transactions";
import socketCluster from "socketcluster-client";

jest.mock("socketcluster-client");

let app: Application;
const logger = {
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
};

const calculateActiveDelegates = () => {
    const activeDelegates = [];
    for (let i = 0; i < 51; i++) {
        const address = `Delegate-Wallet-${i}`;
        const wallet = new Wallet(address, null);
        wallet.publicKey = Identities.PublicKey.fromPassphrase(address);
        // @ts-ignore
        wallet.delegate = { username: `Username: ${address}` };
        activeDelegates.push(wallet);
    }
    return activeDelegates;
};

const initializeClient = (client: Client) => {
    const mockHost = {
        socket: {
            on: () => {},
            disconnect: () => {},
            emit: () => {},
            getState: () => "open",
            OPEN: "open",
        },
        port: 4000,
        hostname: "mock-1",
    };
    // @ts-ignore
    jest.spyOn(socketCluster, "create").mockImplementation(() => mockHost.socket);
    // @ts-ignore
    client.register([mockHost]);
    return mockHost;
};

beforeEach(() => {
    app = new Application(new Container.Container());
    app.bind(Container.Identifiers.LogService).toConstantValue(logger);
});

afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
});

describe("ForgerService", () => {
    let forgerService: ForgerService;
    let client: Client;
    let mockHost;

    beforeEach(() => {
        forgerService = app.resolve<ForgerService>(ForgerService);
        client = app.resolve<Client>(Client);
        mockHost = initializeClient(client);
    });

    describe("Register", () => {
        it("should register an associated client", async () => {
            forgerService.register({ hosts: [mockHost] });
            expect((forgerService as any).client.hosts).toEqual([mockHost]);
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
        it("should set delegates and log active delegates info message", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const delegates = calculateActiveDelegates();

            const corep2p = jest.requireActual("@packages/core-p2p");
            const round = { data: { delegates } };

            corep2p.socketEmit = jest.fn().mockResolvedValue(round);

            forgerService.register({ hosts: [mockHost] });
            await expect(forgerService.boot(delegates)).toResolve();

            expect((forgerService as any).delegates).toEqual(delegates);

            const expectedInfoMessage = `Loaded ${Utils.pluralize(
                "active delegate",
                delegates.length,
                true,
            )}: ${delegates.map(wallet => `${wallet.delegate.username} (${wallet.publicKey})`).join(", ")}`;

            expect(logger.info).toHaveBeenCalledWith(expectedInfoMessage);
        });

        it("should skip logging when the service is already initialised", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const delegates = calculateActiveDelegates();

            const corep2p = jest.requireActual("@packages/core-p2p");
            const round = { data: { delegates } };

            corep2p.socketEmit = jest.fn().mockResolvedValue(round);

            forgerService.register({ hosts: [mockHost] });
            (forgerService as any).initialized = true;
            await expect(forgerService.boot(delegates)).toResolve();
            expect(logger.info).not.toHaveBeenCalledWith(`Forger Manager started.`);
        });

        it("should not log when there are no active delegates", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const corep2p = jest.requireActual("@packages/core-p2p");
            const round = { data: { delegates: [] } };

            corep2p.socketEmit = jest.fn().mockResolvedValue(round);

            forgerService.register({ hosts: [mockHost] });
            await expect(forgerService.boot([])).toResolve();
            expect(logger.info).toHaveBeenCalledTimes(1);
            expect(logger.info).toHaveBeenCalledWith(`Forger Manager started.`);
        });

        it("should log inactive delegates correctly", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const delegates = calculateActiveDelegates();
            const numberActive = 10;

            const corep2p = jest.requireActual("@packages/core-p2p");
            const round = { data: { delegates: delegates.slice(0, numberActive) } };

            corep2p.socketEmit = jest.fn().mockResolvedValue(round);

            const expectedInactiveDelegatesMessage = `Loaded ${Utils.pluralize(
                "inactive delegate",
                delegates.length - numberActive,
                true,
            )}: ${delegates
                .slice(numberActive)
                .map(delegate => delegate.publicKey)
                .join(", ")}`;

            forgerService.register({ hosts: [mockHost] });
            await expect(forgerService.boot(delegates)).toResolve();

            expect(logger.info).toHaveBeenCalledWith(expectedInactiveDelegatesMessage);
        });

        it("should catch and log errors", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const delegates = calculateActiveDelegates();

            const corep2p = jest.requireActual("@packages/core-p2p");

            corep2p.socketEmit = jest.fn().mockRejectedValue({});

            forgerService.register({ hosts: [mockHost] });
            await expect(forgerService.boot(delegates)).toResolve();

            expect(logger.warning).toHaveBeenCalledWith(`Waiting for a responsive host`);
        });

        it("should set correct timeout to check slots", async () => {
            const timeout = 500;
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(timeout);

            const delegates = calculateActiveDelegates();

            const round = { data: { delegates } };

            const corep2p = jest.requireActual("@packages/core-p2p");

            corep2p.socketEmit = jest.fn().mockResolvedValue(round);

            jest.useFakeTimers();

            forgerService.register({ hosts: [mockHost] });
            await expect(forgerService.boot(delegates)).toResolve();

            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), timeout);
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
            const delegates = calculateActiveDelegates();

            expect(
                // @ts-ignore
                forgerService.isForgingAllowed({ status: NetworkStateStatus.Unknown }, delegates[0]),
            ).toEqual(false);
            expect(logger.info).toHaveBeenCalledWith("Failed to get network state from client. Will not forge.");
        });

        it("should not allow forging when network status is a cold start", async () => {
            const delegates = calculateActiveDelegates();

            expect(
                // @ts-ignore
                forgerService.isForgingAllowed({ status: NetworkStateStatus.ColdStart }, delegates[0]),
            ).toEqual(false);
            expect(logger.info).toHaveBeenCalledWith("Skipping slot because of cold start. Will not forge.");
        });

        it("should not allow forging when network status is below minimum peers", async () => {
            const delegates = calculateActiveDelegates();

            expect(
                // @ts-ignore
                forgerService.isForgingAllowed({ status: NetworkStateStatus.BelowMinimumPeers }, delegates[0]),
            ).toEqual(false);
            expect(logger.info).toHaveBeenCalledWith("Network reach is not sufficient to get quorum. Will not forge.");
        });

        it("should log double forge warning for any overheight block headers", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const delegates = calculateActiveDelegates();

            const round = { data: { delegates } };

            const corep2p = jest.requireActual("@packages/core-p2p");

            corep2p.socketEmit = jest.fn().mockResolvedValue(round);

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

            const mockNetworkState = {
                status: NetworkStateStatus.Default,
                getOverHeightBlockHeaders: () => overHeightBlockHeaders,
                getQuorum: () => 0.99,
            };

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
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const delegates = calculateActiveDelegates();

            const round = { data: { delegates } };

            const corep2p = jest.requireActual("@packages/core-p2p");

            corep2p.socketEmit = jest.fn().mockResolvedValue(round);

            forgerService.register({ hosts: [mockHost] });
            await forgerService.boot(delegates);

            const mockNetworkState = {
                status: NetworkStateStatus.Default,
                getOverHeightBlockHeaders: () => [],
                getQuorum: () => 0.6,
                toJson: () => "test json",
            };

            expect(
                // @ts-ignore
                forgerService.isForgingAllowed(mockNetworkState, delegates[0]),
            ).toEqual(false);

            expect(logger.info).toHaveBeenCalledWith("Fork 6 - Not enough quorum to forge next block. Will not forge.");

            expect(logger.debug).toHaveBeenCalledWith(`Network State: ${mockNetworkState.toJson()}`);

            expect(logger.warning).not.toHaveBeenCalled();
        });

        it("should allow forging if quorum is met", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const delegates = calculateActiveDelegates();

            const round = { data: { delegates } };

            const corep2p = jest.requireActual("@packages/core-p2p");

            corep2p.socketEmit = jest.fn().mockResolvedValue(round);

            forgerService.register({ hosts: [mockHost] });
            await forgerService.boot(delegates);

            const mockNetworkState = {
                status: NetworkStateStatus.Default,
                getOverHeightBlockHeaders: () => [],
                getQuorum: () => 0.7,
                toJson: () => "test json",
            };

            expect(
                // @ts-ignore
                forgerService.isForgingAllowed(mockNetworkState, delegates[0]),
            ).toEqual(true);

            expect(logger.debug).not.toHaveBeenCalled();

            expect(logger.warning).not.toHaveBeenCalled();
        });

        it("should allow forging if quorum is met, not log warning if overheight delegate is not the same", async () => {
            const slotSpy = jest.spyOn(Crypto.Slots, "getTimeInMsUntilNextSlot");
            slotSpy.mockReturnValue(0);

            const delegates = calculateActiveDelegates();

            const round = { data: { delegates } };

            const corep2p = jest.requireActual("@packages/core-p2p");

            corep2p.socketEmit = jest.fn().mockResolvedValue(round);

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

            const mockNetworkState = {
                status: NetworkStateStatus.Default,
                getOverHeightBlockHeaders: () => overHeightBlockHeaders,
                getQuorum: () => 0.7,
                toJson: () => "test json",
            };

            expect(
                // @ts-ignore
                forgerService.isForgingAllowed(mockNetworkState, delegates[1]),
            ).toEqual(true);

            expect(logger.debug).not.toHaveBeenCalled();

            expect(logger.warning).not.toHaveBeenCalled();
        });
    });
});
