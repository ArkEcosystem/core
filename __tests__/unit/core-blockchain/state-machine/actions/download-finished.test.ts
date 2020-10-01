import { Container } from "@arkecosystem/core-kernel";
import { DownloadFinished } from "@packages/core-blockchain/src/state-machine/actions/download-finished";

describe("DownloadFinished", () => {
    const container = new Container.Container();

    const blockchain = { dispatch: jest.fn(), getQueue: jest.fn() };
    const stateStore = { networkStart: false };
    const logger = { warning: jest.fn(), debug: jest.fn(), info: jest.fn(), error: jest.fn() };

    const application = { resolve: jest.fn() };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.Application).toConstantValue(application);
        container.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
        container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("handle", () => {
        it("should dispatch SYNCFINISHED when stateStore.networkStart", () => {
            const downloadFinished = container.resolve<DownloadFinished>(DownloadFinished);

            stateStore.networkStart = true;
            downloadFinished.handle();

            expect(blockchain.dispatch).toHaveBeenCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenCalledWith("SYNCFINISHED");
        });

        it("should dispatch PROCESSFINISHED when blockchain.getQueue.idle()", () => {
            const downloadFinished = container.resolve<DownloadFinished>(DownloadFinished);

            blockchain.getQueue = jest.fn().mockReturnValueOnce({
                idle: jest.fn().mockReturnValue(true),
            });
            downloadFinished.handle();

            expect(blockchain.dispatch).toHaveBeenCalledTimes(1);
            expect(blockchain.dispatch).toHaveBeenCalledWith("PROCESSFINISHED");
        });

        it("should dispatch nothing when !blockchain.getQueue.idle()", () => {
            const downloadFinished = container.resolve<DownloadFinished>(DownloadFinished);

            blockchain.getQueue = jest.fn().mockReturnValueOnce({
                idle: jest.fn().mockReturnValue(false),
            });
            downloadFinished.handle();

            expect(blockchain.dispatch).toHaveBeenCalledTimes(0);
        });
    });
});
