import { Container } from "@arkecosystem/core-kernel";
import { Stopped } from "../../../../../packages/core-blockchain/src/state-machine/actions/stopped";

describe("Stopped", () => {
    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn(), info: jest.fn() };

    const application = { get: jest.fn() };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.Application).toConstantValue(application);
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("handle", () => {
        it("should log 'The blockchain has been stopped'", () => {
            const stopped = container.resolve<Stopped>(Stopped);

            stopped.handle();

            expect(logger.info).toHaveBeenCalledTimes(1);
            expect(logger.info).toHaveBeenCalledWith("The blockchain has been stopped");
        });
    });
});
