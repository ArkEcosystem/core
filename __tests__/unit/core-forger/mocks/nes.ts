export const nesClient = {
    connect: jest.fn().mockReturnValue(new Promise((resolve) => resolve())),
    disconnect: jest.fn(),
    request: jest.fn().mockReturnValue({ payload: Buffer.from(JSON.stringify({})) }),
    onError: jest.fn(),
    _isReady: jest.fn().mockReturnValue(true),
    setMaxPayload: jest.fn(),
};

export default {
    Client: jest.fn().mockImplementation(() => nesClient),
};
