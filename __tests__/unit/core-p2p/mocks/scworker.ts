class SCWorker {
    public scServer = {
        addMiddleware: jest.fn(),
        on: jest.fn(),
        MIDDLEWARE_HANDSHAKE_WS: undefined,
        MIDDLEWARE_EMIT: undefined,
    };

    public sendToMaster = jest.fn().mockImplementation((data, cb) => cb(undefined, {}));
}

jest.mock("socketcluster/scworker", () => SCWorker);
