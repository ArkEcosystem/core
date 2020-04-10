export const nesClient = {
    connect: jest.fn().mockReturnValue(new Promise(resolve => resolve())),
    disconnect: jest.fn(),
    request: jest.fn().mockReturnValue({ payload: {} }),
    onError: jest.fn(),
    _isReady: jest.fn().mockReturnValue(true)
};

export default {
    Client: jest.fn().mockImplementation(() => nesClient)
};