import "jest-extended";
import { resolve } from "path";
import { Application } from "@packages/core-kernel/src/application";
import { Container, interfaces, Identifiers } from "@packages/core-kernel/src/container";
import { PackageManifest } from "@packages/core-kernel/src/providers/package-manifest";
import { ConfigRepository } from "@packages/core-kernel/src/services/config";

let app: Application;
let container: interfaces.Container;
let packageConfiguration: PackageManifest;

beforeEach(() => {
    container = new Container();
    container.snapshot();

    app = new Application(container);
    app.bind(Identifiers.ConfigRepository).toConstantValue(new ConfigRepository({}));

    packageConfiguration = app.resolve<PackageManifest>(PackageManifest);
});

afterEach(() => container.restore());

describe("PackageManifest", () => {
    it("should discover the manifest for the given package", () => {
        packageConfiguration.discover(resolve(__dirname, "../__stubs__/stub-package"));

        expect(packageConfiguration.has("name")).toBeTrue();
        expect(packageConfiguration.get("name")).toBe("stub-package");
    });
});
