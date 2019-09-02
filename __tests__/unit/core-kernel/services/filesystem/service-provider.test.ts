import "jest-extended";

import { Application } from "@packages/core-kernel/src/application";
import { Container, interfaces, Identifiers } from "@packages/core-kernel/src/ioc";
import { ServiceProvider } from "@packages/core-kernel/src/services/filesystem";
import { LocalFilesystem } from "@packages/core-kernel/src/services/filesystem/drivers/local";

let app: Application;
let container: interfaces.Container;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);
});

afterEach(() => container.restore());

describe("FilesystemServiceProvider", () => {
    it(".register", async () => {
        expect(app.isBound(Identifiers.FilesystemManager)).toBeFalse();
        expect(app.isBound(Identifiers.FilesystemService)).toBeFalse();

        await app.resolve<ServiceProvider>(ServiceProvider).register();

        expect(app.isBound(Identifiers.FilesystemManager)).toBeTrue();
        expect(app.isBound(Identifiers.FilesystemService)).toBeTrue();
        expect(app.get(Identifiers.FilesystemService)).toBeInstanceOf(LocalFilesystem);
    });
});
