export class NesClient {
    public connect() {
        return;
    }
    public disconnect() {
        return;
    }

    public request() {
        return;
    }
}

export default {
    Client: jest.fn().mockImplementation((url) => new NesClient()),
};
