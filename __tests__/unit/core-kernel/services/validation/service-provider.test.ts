import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, interfaces, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider } from "@packages/core-kernel/src/services/validation";
import { JoiValidator } from "@packages/core-kernel/src/services/validation/drivers/joi";

let app: Application;
let container: interfaces.Container;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);
});

afterEach(() => container.restore());

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
