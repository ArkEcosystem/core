import "jest-extended";

import { Client } from "@packages/core-forger/src/client";
import { ForgerService } from "@packages/core-forger/src/forger-service";
import { Application, Container, Utils } from "@packages/core-kernel";
import { Wallet } from "@packages/core-state/src/wallets";
import { Crypto, Identities } from "@packages/crypto";
import socketCluster from "socketcluster-client";

jest.mock("socketcluster-client");

let app: Application;
const logger = {
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
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
    });
});
