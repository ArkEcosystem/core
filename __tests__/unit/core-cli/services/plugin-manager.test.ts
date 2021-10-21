import { Console } from "@arkecosystem/core-test-framework";
import { PluginManager } from "@packages/core-cli/src/services";
import { join } from "path";
import { setGracefulCleanup } from "tmp";

let cli;
let pluginManager;

beforeAll(() => setGracefulCleanup());

beforeEach(() => {
    cli = new Console();

    pluginManager = cli.app.resolve(PluginManager);
});

describe("DiscoverPlugins", () => {
    describe("discover", () => {
        it("should discover packages containing package.json", async () => {
            const pluginsPath: string = join(__dirname, "./plugins");

            jest.spyOn(pluginManager, "getPluginsPath").mockReturnValue(pluginsPath);

            const plugins = await pluginManager.list("ark", "testnet");

            expect(plugins).toEqual([
                {
                    name: "@namespace/package2",
                    path: join(pluginsPath, "/namespace/package2"),
                    version: "2.0.0",
                },
                {
                    name: "package1",
                    path: join(pluginsPath, "/package1"),
                    version: "1.0.0",
                },
            ]);
        });

        it("should return empty array if path doesn't exist", async () => {
            const plugins = await pluginManager.list("ark", "undefined");

            expect(plugins).toEqual([]);
        });
    });
});
