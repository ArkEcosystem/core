export class HapiServer {
    public start() {
        return;
    }
    public stop() {
        return;
    }

    public inject() {
        return;
    }

    public route() {
        return;
    }

    public register() {
        return;
    }
}

export default {
    Server: jest.fn().mockImplementation(() => new HapiServer()),
};
