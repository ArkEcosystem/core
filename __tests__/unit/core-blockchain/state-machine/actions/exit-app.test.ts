import { Container } from "@arkecosystem/core-kernel";
import { ExitApp } from "../../../../../packages/core-blockchain/src/state-machine/actions/exit-app";

describe("ExitApp", () => {
    const container = new Container.Container();

    const application = { terminate: jest.fn() };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.Application).toConstantValue(application);
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("handle", () => {
        it("should call app.terminate()", () => {
            const exitApp = container.resolve<ExitApp>(ExitApp);

            exitApp.handle();

            expect(application.terminate).toHaveBeenCalledTimes(1);
        });
    });
});
