import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, interfaces, Identifiers } from "@packages/core-kernel/src/container";
import { ServiceProvider } from "@packages/core-kernel/src/services/mixins";

let app: Application;
let container: interfaces.Container;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);
});

afterEach(() => container.restore());

describe("MixinServiceProvider", () => {
    it(".register", async () => {
        expect(app.isBound(Identifiers.MixinService)).toBeFalse();

        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.MixinService)).toBeTrue();
    });
});
