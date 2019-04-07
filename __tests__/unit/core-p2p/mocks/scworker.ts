class SCWorker {
    public scServer = {
        addMiddleware: jest.fn(),
        on: jest.fn(),
        MIDDLEWARE_HANDSHAKE_WS: null,
        MIDDLEWARE_EMIT: null,
    };

    public sendToMaster = jest.fn();
}

jest.mock("socketcluster/scworker", () => SCWorker);
