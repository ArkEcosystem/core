import { log } from "@packages/core-api/src/plugins/log";

const logger = {
    debug: jest.fn(),
};

const server = {
    ext: jest.fn(),
    app: {
        app: {
            get: jest.fn().mockReturnValue(logger),
        },
    },
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe("Log", () => {
    it("should register extension when enabled", () => {
        log.register(server, { enabled: true, trustProxy: false });

        expect(server.ext).toBeCalled();
    });

    it("should not register extension when disabled", () => {
        log.register(server, { enabled: false, trustProxy: false });

        expect(server.ext).not.toBeCalled();
    });

    it("should log request and continue", () => {
        const request = {
            path: "api/method",
            url: { search: "?param=value" },
            info: {
                remoteAddress: "127.0.0.1",
            },
        };

        const h = {
            continue: Symbol,
        };

        log.register(server, { enabled: true, trustProxy: false });

        expect(server.ext).toBeCalled();

        const onRequest = server.ext.mock.calls[0][1];

        const ret = onRequest(request, h);

        expect(ret).toBe(h.continue);
        expect(logger.debug).toHaveBeenCalledWith(
            `API request on: "${request.path}" from: "${request.info.remoteAddress}" with query: "${request.url.search}"`,
        );
    });
});
