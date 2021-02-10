import { Container } from "@arkecosystem/core-kernel";

import { RateLimitPlugin } from "@arkecosystem/core-p2p/src/socket-server/plugins/rate-limit";
import { BlocksRoute } from "@arkecosystem/core-p2p/src/socket-server/routes/blocks";
import { InternalRoute } from "@arkecosystem/core-p2p/src/socket-server/routes/internal";
import { PeerRoute } from "@arkecosystem/core-p2p/src/socket-server/routes/peer";
import { TransactionsRoute } from "@arkecosystem/core-p2p/src/socket-server/routes/transactions";

const app = {
    resolve: jest.fn(),
};

const rateLimiter = {
    consumeIncoming: jest.fn(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.Application).toConstantValue(app);
container.bind(Container.Identifiers.PeerRateLimiter).toConstantValue(rateLimiter);

afterEach(() => {
    jest.clearAllMocks();
});

describe("RateLimitPlugin.register", () => {
    it("should collect route configs", () => {
        const server = { ext: jest.fn() };
        const internalRoute = { getRoutesConfigByPath: jest.fn() };
        const peerRoute = { getRoutesConfigByPath: jest.fn() };
        const blocksRoute = { getRoutesConfigByPath: jest.fn() };
        const transactionsRoute = { getRoutesConfigByPath: jest.fn() };

        internalRoute.getRoutesConfigByPath.mockReturnValueOnce({});
        peerRoute.getRoutesConfigByPath.mockReturnValueOnce({});
        blocksRoute.getRoutesConfigByPath.mockReturnValueOnce({});
        transactionsRoute.getRoutesConfigByPath.mockReturnValueOnce({});

        app.resolve.mockReturnValueOnce(internalRoute);
        app.resolve.mockReturnValueOnce(peerRoute);
        app.resolve.mockReturnValueOnce(blocksRoute);
        app.resolve.mockReturnValueOnce(transactionsRoute);

        const rateLimitPlugin = container.resolve(RateLimitPlugin);
        rateLimitPlugin.register(server);

        expect(app.resolve).toBeCalledTimes(4);
        expect(app.resolve).toBeCalledWith(InternalRoute);
        expect(app.resolve).toBeCalledWith(PeerRoute);
        expect(app.resolve).toBeCalledWith(BlocksRoute);
        expect(app.resolve).toBeCalledWith(TransactionsRoute);

        expect(internalRoute.getRoutesConfigByPath).toBeCalledTimes(1);
        expect(peerRoute.getRoutesConfigByPath).toBeCalledTimes(1);
        expect(blocksRoute.getRoutesConfigByPath).toBeCalledTimes(1);
        expect(transactionsRoute.getRoutesConfigByPath).toBeCalledTimes(1);

        expect(server.ext).toBeCalledWith({ type: "onPreAuth", method: expect.any(Function) });
    });
});
