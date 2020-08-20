import "jest-extended";

import { Application, Container, Services } from "@packages/core-kernel";
import { ServiceProvider } from "@packages/core-state/src";

let app: Application;

beforeEach(() => {
    app = new Application(new Container.Container());
    app.bind(Container.Identifiers.TriggerService).to(Services.Triggers.Triggers).inSingletonScope();
});

afterAll(() => jest.clearAllMocks());

describe("ServiceProvider", () => {
    let serviceProvider: ServiceProvider;

    beforeEach(() => {
        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
    });

    afterAll(() => jest.clearAllMocks());

    it("should register", async () => {
        await expect(serviceProvider.register()).toResolve();
    });

    it("should boot correctly", async () => {
        const initializeSpy = jest.fn();
        jest.spyOn(app, "get").mockReturnValue({ initialize: initializeSpy, bind: jest.fn() });
        await serviceProvider.register();
        expect(async () => await serviceProvider.boot()).not.toThrow();
        expect(initializeSpy).toHaveBeenCalled();
    });

    it("should boot when the package is core-database", async () => {
        expect(await serviceProvider.bootWhen()).toEqual(false);
        expect(await serviceProvider.bootWhen("@arkecosystem/core-database")).toEqual(true);
    });
});
