import { Container } from "@arkecosystem/core-kernel";
import { CheckLater } from "../../../../../packages/core-blockchain/src/state-machine/actions/check-later";


describe("CheckLater", () => {
    const container = new Container.Container();

    const blockchain = { isStopped: false, setWakeUp: jest.fn() };
    const stateStore = { wakeUpTimeout: undefined };

    const application = { resolve: jest.fn() };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.Application).toConstantValue(application);
        container.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);  
        container.bind(Container.Identifiers.StateStore).toConstantValue(stateStore);  
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("handle", () => {
        it("should call blockchain.setWakeUp() when !blockchain.isStopped && !stateStore.wakeUpTimeout",() => {
            const checkLater = container.resolve<CheckLater>(CheckLater);

            checkLater.handle();

            expect(blockchain.setWakeUp).toHaveBeenCalledTimes(1);
        })
        
        it("should do nothing otherwise",() => {
            const checkLater = container.resolve<CheckLater>(CheckLater);

            blockchain.isStopped = true;
            checkLater.handle();

            expect(blockchain.setWakeUp).toHaveBeenCalledTimes(0);
        })
    })
})