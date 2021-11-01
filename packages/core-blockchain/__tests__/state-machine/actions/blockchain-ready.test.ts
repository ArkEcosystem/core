import { Container, Enums } from "@arkecosystem/core-kernel";
import { BlockchainReady } from "@packages/core-blockchain/src/state-machine/actions/blockchain-ready";

describe("BlockchainReady", () => {
    const container = new Container.Container();

    const logService = { warning: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() };
    const stateStore = {
        isStarted: jest.fn().mockReturnValue(false),
        setStarted: jest.fn(),
    };
    const eventDispatcher = { dispatch: jest.fn() };

    const application = { resolve: jest.fn() };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.Application).toConstantValue(application);
        container.bind(Container.Identifiers.LogService).toConstantValue(logService);
        container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);
        container.bind(Container.Identifiers.EventDispatcherService).toConstantValue(eventDispatcher);
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("handle", () => {
        it("should set stateStore.started = true and dispatch started event", () => {
            const blockchainReady = container.resolve<BlockchainReady>(BlockchainReady);

            stateStore.isStarted = jest.fn().mockReturnValue(false);
            blockchainReady.handle();

            expect(stateStore.setStarted).toHaveBeenCalledWith(true);
            expect(eventDispatcher.dispatch).toHaveBeenCalledTimes(1);
            expect(eventDispatcher.dispatch).toHaveBeenLastCalledWith(Enums.StateEvent.Started, true);
        });

        it("should do nothing if stateStore.started is true", () => {
            const blockchainReady = container.resolve<BlockchainReady>(BlockchainReady);

            stateStore.isStarted = jest.fn().mockReturnValue(true);
            blockchainReady.handle();

            expect(eventDispatcher.dispatch).toHaveBeenCalledTimes(0);
        });
    });
});
