import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider } from "@packages/core-kernel/src/services/actions";
import { Actions } from "@packages/core-kernel/src/services/actions/actions";

let app: Application;

beforeEach(() => (app = new Application(new Container())));

describe("ActionsServiceProvider", () => {
    it(".register", async () => {
        expect(app.isBound(Identifiers.ActionService)).toBeFalse();

        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.ActionService)).toBeTrue();
        expect(app.get(Identifiers.ActionService)).toBeInstanceOf(Actions);
    });
});
