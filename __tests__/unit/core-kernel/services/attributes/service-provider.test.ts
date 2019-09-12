import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider } from "@packages/core-kernel/src/services/attributes/service-provider";
import { AttributeService } from "@packages/core-kernel/src/services/attributes/attribute-service";

let app: Application;

beforeEach(() => (app = new Application(new Container())));

describe("AttributeServiceProvider", () => {
    it(".register", async () => {
        expect(app.isBound(Identifiers.AttributeService)).toBeFalse();

        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.AttributeService)).toBeTrue();
        expect(app.get(Identifiers.AttributeService)).toBeInstanceOf(AttributeService);
    });
});
