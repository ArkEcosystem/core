import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider } from "@packages/core-kernel/src/services/validation";
import { JoiValidator } from "@packages/core-kernel/src/services/validation/drivers/joi";

let app: Application;

beforeEach(() => (app = new Application(new Container())));

describe("ValidationServiceProvider", () => {
    it(".register", async () => {
        expect(app.isBound(Identifiers.ValidationManager)).toBeFalse();
        expect(app.isBound(Identifiers.ValidationService)).toBeFalse();

        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.ValidationManager)).toBeTrue();
        expect(app.isBound(Identifiers.ValidationService)).toBeTrue();
        expect(app.get(Identifiers.ValidationService)).toBeInstanceOf(JoiValidator);
    });
});
