import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider } from "@packages/core-kernel/src/services/remote-actions";
import { Pm2RemoteActionsService } from "@packages/core-kernel/src/services/remote-actions/drivers/pm2";

let app: Application;

beforeEach(() => (app = new Application(new Container())));

describe("RemoteActionsServiceProvider", () => {
    it(".register", async () => {
        expect(app.isBound(Identifiers.RemoteActionsService)).toBeFalse();

        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.RemoteActionsService)).toBeTrue();
        expect(app.get(Identifiers.RemoteActionsService)).toBeInstanceOf(Pm2RemoteActionsService);
    });
});
