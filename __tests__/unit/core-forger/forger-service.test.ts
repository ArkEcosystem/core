import "jest-extended";

import { Client } from "@packages/core-forger/src/client";
import { ForgerService } from "@packages/core-forger/src/forger-service";
import { Application, Container } from "@packages/core-kernel";
import socketCluster from "socketcluster-client";

jest.mock("socketcluster-client");

let app: Application;
const logger = {
    error: jest.fn(),
    debug: jest.fn(),
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
});
