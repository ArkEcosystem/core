import { Container } from "@packages/core-kernel";
import { ConsensusRoute } from "@packages/core-p2p/src/socket-server/routes/consensus";

describe("ConsensusRoute", () => {
    let consensusRoute: ConsensusRoute;

    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn() };
    const controller = { getPeers: jest.fn() }; // a mock peer controller
    const app = { resolve: jest.fn().mockReturnValue(controller) };
    const server = { bind: jest.fn(), route: jest.fn() };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.Application).toConstantValue(app);
    });

    beforeEach(() => {
        consensusRoute = container.resolve<ConsensusRoute>(ConsensusRoute);
    });

    it("should bind the controller to the server and register the routes", () => {
        const routes = consensusRoute.getRoutesConfigByPath();
        const routesExpected = Object.entries(routes).map(([path, config]) => ({
            method: "POST",
            path,
            config: {
                id: config.id,
                handler: config.handler,
                payload: {
                    maxBytes: config.maxBytes,
                },
                isInternal: true,
            },
        }));

        consensusRoute.register(server);

        expect(server.bind).toBeCalledTimes(1);
        expect(server.bind).toBeCalledWith(controller);

        expect(server.route).toBeCalledTimes(routesExpected.length);
        for (const route of routesExpected) {
            expect(server.route).toBeCalledWith(route);
        }
    });
});
