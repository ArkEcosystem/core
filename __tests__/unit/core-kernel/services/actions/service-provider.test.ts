import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, interfaces, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider } from "@packages/core-kernel/src/services/actions";
import { Actions } from "@packages/core-kernel/src/services/actions/actions";

let app: Application;
let container: interfaces.Container;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);
});

afterEach(() => container.restore());

describe("ActionsServiceProvider", () => {
    it(".register", async () => {
        expect(app.isBound(Identifiers.ActionService)).toBeFalse();

        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.ActionService)).toBeTrue();
        expect(app.get(Identifiers.ActionService)).toBeInstanceOf(Actions);
    });
});
