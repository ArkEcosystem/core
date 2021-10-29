import { Server } from "@hapi/hapi";
import { Container } from "@packages/core-kernel";
import { AwaitBlockPlugin } from "@packages/core-p2p/src/socket-server/plugins/await-block";
import Joi from "joi";

afterEach(() => {
    jest.clearAllMocks();
});

describe("AwaitBlockPlugin", () => {
    const responsePayload = { status: "ok" };
    const mockRouteByPath = {
        "/p2p/peer/mockroute_internal": {
            id: "p2p.peer.getPeers",
            handler: () => responsePayload,
            validation: Joi.object().max(0),
        },
    };
    const mockRouteInternal = {
        method: "POST",
        path: "/p2p/peer/mockroute_internal",
        config: {
            id: mockRouteByPath["/p2p/peer/mockroute_internal"].id,
            handler: mockRouteByPath["/p2p/peer/mockroute_internal"].handler,
        },
    };

    const mockRoute = {
        method: "POST",
        path: "/p2p/peer/mockroute",
        config: {
            id: mockRouteByPath["/p2p/peer/mockroute_internal"].id,
            handler: mockRouteByPath["/p2p/peer/mockroute_internal"].handler,
        },
    };

    const app = {
        resolve: jest.fn().mockReturnValue({ getRoutesConfigByPath: () => mockRouteByPath }),
    };

    let awaitBlockPlugin: AwaitBlockPlugin;
    let container: Container.Container;
    let queue;
    let blockchain;
    let stateStore;

    beforeEach(() => {
        queue = {
            isRunning: jest.fn().mockReturnValue(true),
            once: jest.fn().mockImplementation((event, callback) => {
                setTimeout(() => {
                    callback();
                }, 10);
            }),
        };

        blockchain = {
            getQueue: () => {
                return queue;
            },
        };

        stateStore = {
            getBlockchain: jest.fn().mockReturnValue({
                value: "newBlock",
            }),
        };

        container = new Container.Container();
        container.bind(Container.Identifiers.Application).toConstantValue(app);
        container.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
        container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);

        awaitBlockPlugin = container.resolve<AwaitBlockPlugin>(AwaitBlockPlugin);
    });

    it("should continue if route is internal", async () => {
        const server = new Server({ port: 4100 });
        server.route(mockRouteInternal);

        const spyExt = jest.spyOn(server, "ext");

        awaitBlockPlugin.register(server);

        expect(spyExt).toBeCalledWith(expect.objectContaining({ type: "onPreAuth" }));

        // try the route with a valid payload
        const remoteAddress = "187.166.55.44";
        const responseValid = await server.inject({
            method: "POST",
            url: "/p2p/peer/mockroute_internal",
            payload: {},
            remoteAddress,
        });
        expect(JSON.parse(responseValid.payload)).toEqual(responsePayload);
        expect(responseValid.statusCode).toBe(200);
        expect(stateStore.getBlockchain).not.toBeCalled();
        expect(queue.isRunning).not.toBeCalled();
        expect(queue.once).not.toBeCalled();
    });

    it("should continue if state !== newBlock", async () => {
        stateStore.getBlockchain.mockReturnValue({
            value: "syncing",
        });

        const server = new Server({ port: 4100 });
        server.route(mockRoute);

        const spyExt = jest.spyOn(server, "ext");

        awaitBlockPlugin.register(server);

        expect(spyExt).toBeCalledWith(expect.objectContaining({ type: "onPreAuth" }));

        // try the route with a valid payload
        const remoteAddress = "187.166.55.44";
        const responseValid = await server.inject({
            method: "POST",
            url: "/p2p/peer/mockroute",
            payload: {},
            remoteAddress,
        });
        expect(JSON.parse(responseValid.payload)).toEqual(responsePayload);
        expect(responseValid.statusCode).toBe(200);
        expect(stateStore.getBlockchain).toBeCalled();
        expect(queue.isRunning).not.toBeCalled();
        expect(queue.once).not.toBeCalled();
    });

    it("should continue if queue is not running", async () => {
        queue.isRunning.mockReturnValue(false);

        const server = new Server({ port: 4100 });
        server.route(mockRoute);

        const spyExt = jest.spyOn(server, "ext");

        awaitBlockPlugin.register(server);

        expect(spyExt).toBeCalledWith(expect.objectContaining({ type: "onPreAuth" }));

        // try the route with a valid payload
        const remoteAddress = "187.166.55.44";
        const responseValid = await server.inject({
            method: "POST",
            url: "/p2p/peer/mockroute",
            payload: {},
            remoteAddress,
        });
        expect(JSON.parse(responseValid.payload)).toEqual(responsePayload);
        expect(responseValid.statusCode).toBe(200);
        expect(stateStore.getBlockchain).toBeCalled();
        expect(queue.isRunning).toBeCalled();
        expect(queue.once).not.toBeCalled();
    });

    it("should await block processing", async () => {
        const server = new Server({ port: 4100 });
        server.route(mockRoute);
        awaitBlockPlugin.register(server);

        // try the route with a valid payload
        const remoteAddress = "187.166.55.44";
        const responseValid = await server.inject({
            method: "POST",
            url: "/p2p/peer/mockroute",
            payload: {},
            remoteAddress,
        });

        expect(responseValid.statusCode).toBe(200);
        expect(stateStore.getBlockchain).toBeCalled();
        expect(queue.isRunning).toBeCalled();
        expect(queue.once).toBeCalled();
    });
});
