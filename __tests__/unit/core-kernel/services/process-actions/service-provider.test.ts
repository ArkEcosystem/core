import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider } from "@packages/core-kernel/src/services/process-actions";
import { Pm2ProcessActionsService } from "@packages/core-kernel/src/services/process-actions/drivers/pm2";

let app: Application;

beforeEach(() => (app = new Application(new Container())));

describe("ProcessActionsServiceProvider", () => {
    it(".register", async () => {
        expect(app.isBound(Identifiers.ProcessActionsService)).toBeFalse();

        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.ProcessActionsService)).toBeTrue();
        expect(app.get(Identifiers.ProcessActionsService)).toBeInstanceOf(Pm2ProcessActionsService);
    });
});
