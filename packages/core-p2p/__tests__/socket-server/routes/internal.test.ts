import { Container } from "@packages/core-kernel";
import { InternalRoute } from "@packages/core-p2p/src/socket-server/routes/internal";
import Hapi from "@hapi/hapi";

describe("InternalRoute", () => {
    let internalRoute: InternalRoute;

    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn() };
    const controller = { getCurrentRound: jest.fn() }; // a mock internal controller
    const app = { resolve: jest.fn().mockReturnValue(controller) };
    const server: Partial<Hapi.Server> = { bind: jest.fn(), route: jest.fn() };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.Application).toConstantValue(app);
    });

    beforeEach(() => {
        internalRoute = container.resolve<InternalRoute>(InternalRoute);
    });

    it("should bind the controller to the server and register the routes", () => {
        const routes = internalRoute.getRoutesConfigByPath();
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

        internalRoute.register(server as Hapi.Server);

        expect(server.bind).toBeCalledTimes(1);
        expect(server.bind).toBeCalledWith(controller);

        expect(server.route).toBeCalledTimes(routesExpected.length);
        for (const route of routesExpected) {
            expect(server.route).toBeCalledWith(route);
        }
    });
});
