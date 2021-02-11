import { Container } from "@arkecosystem/core-kernel";
import { Boom } from "@hapi/boom";

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

const internalRoute = { getRoutesConfigByPath: jest.fn() };
const peerRoute = { getRoutesConfigByPath: jest.fn() };
const blocksRoute = { getRoutesConfigByPath: jest.fn() };
const transactionsRoute = { getRoutesConfigByPath: jest.fn() };

beforeEach(() => {
    internalRoute.getRoutesConfigByPath.mockReturnValue({});
    peerRoute.getRoutesConfigByPath.mockReturnValue({});
    blocksRoute.getRoutesConfigByPath.mockReturnValue({});
    transactionsRoute.getRoutesConfigByPath.mockReturnValue({});

    app.resolve.mockReturnValueOnce(internalRoute);
    app.resolve.mockReturnValueOnce(peerRoute);
    app.resolve.mockReturnValueOnce(blocksRoute);
    app.resolve.mockReturnValueOnce(transactionsRoute);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("RateLimitPlugin.initialize", () => {
    it("should collect route configs", () => {
        container.resolve(RateLimitPlugin);

        expect(app.resolve).toBeCalledTimes(4);
        expect(app.resolve).toBeCalledWith(InternalRoute);
        expect(app.resolve).toBeCalledWith(PeerRoute);
        expect(app.resolve).toBeCalledWith(BlocksRoute);
        expect(app.resolve).toBeCalledWith(TransactionsRoute);

        expect(internalRoute.getRoutesConfigByPath).toBeCalledTimes(1);
        expect(peerRoute.getRoutesConfigByPath).toBeCalledTimes(1);
        expect(blocksRoute.getRoutesConfigByPath).toBeCalledTimes(1);
        expect(transactionsRoute.getRoutesConfigByPath).toBeCalledTimes(1);
    });
});

describe("RateLimitPlugin.register", () => {
    it("should register server extension", () => {
        const server = { ext: jest.fn() };

        const rateLimitPlugin = container.resolve(RateLimitPlugin);
        rateLimitPlugin.register(server);

        expect(server.ext).toBeCalledWith({
            type: "onPreAuth",
            method: expect.any(Function),
        });
    });
});

describe("RateLimitPlugin.onPreAuth", () => {
    it("should allow request when rate limit point was successfully consumed", async () => {
        internalRoute.getRoutesConfigByPath.mockReturnValueOnce({
            "/rate-limited/path": {
                id: "rate_limited_id",
            },
        });

        const request = {
            path: "/rate-limited/path",
            info: { remoteAddress: "1.1.1.1" },
        };

        const h = {
            continue: Symbol(),
        };

        rateLimiter.consumeIncoming.mockResolvedValueOnce(true);

        const rateLimitPlugin = container.resolve(RateLimitPlugin);
        const result = await rateLimitPlugin.onPreAuth(request, h);

        expect(result).toBe(h.continue);
        expect(rateLimiter.consumeIncoming).toBeCalledWith("1.1.1.1", "rate_limited_id");
    });

    it("should deny request when rate limit point wasn't successfully consumed", async () => {
        internalRoute.getRoutesConfigByPath.mockReturnValueOnce({
            "/rate-limited/path": {
                id: "rate_limited_id",
            },
        });

        const request = {
            path: "/rate-limited/path",
            info: { remoteAddress: "1.1.1.1" },
        };

        const h = {
            continue: Symbol(),
        };

        rateLimiter.consumeIncoming.mockResolvedValueOnce(false);

        const rateLimitPlugin = container.resolve(RateLimitPlugin);
        const result = await rateLimitPlugin.onPreAuth(request, h);

        expect(result).toBeInstanceOf(Boom);
        expect(rateLimiter.consumeIncoming).toBeCalledWith("1.1.1.1", "rate_limited_id");
    });
});
