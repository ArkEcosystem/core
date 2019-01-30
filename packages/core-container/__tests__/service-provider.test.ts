import * as Hapi from "hapi";
import "jest-extended";

import { Application } from "../src/application";
import { ServiceProvider } from "./__stubs__/service-provider";

let app: Application;
let serviceProvider: ServiceProvider;
beforeEach(() => {
    app = new Application();
    serviceProvider = new ServiceProvider(app);
});

describe("Plugin", () => {
    it("should call the <register> method of a service provider", async () => {
        await serviceProvider.register();

        expect(app.resolve(serviceProvider.getName())).toBeTrue();
    });

    it("should call the <dispose> method of a service provider", async () => {
        await serviceProvider.register();

        expect(app.resolve(serviceProvider.getName())).toBeTrue();

        await serviceProvider.dispose();

        expect(app.resolve(serviceProvider.getName())).toBeFalse();
    });
});
