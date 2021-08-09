import { Console } from "@arkecosystem/core-test-framework";
import { DiscoverPlugins } from "@packages/core-cli/src/commands";
import { join } from "path";
import { setGracefulCleanup } from "tmp";

let cli;
let cmd;

beforeAll(() => setGracefulCleanup());

beforeEach(() => {
    cli = new Console();

    cmd = cli.app.resolve(DiscoverPlugins);
});

describe("DiscoverPlugins", () => {
    describe("discover", () => {
        it("should discover packages containing package.json", async () => {
            const pluginsPath: string = join(__dirname, "./plugins");

            const plugins = await cmd.discover(pluginsPath);

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
            const plugins = await cmd.discover("invalid/path");

            expect(plugins).toEqual([]);
        })
    });
});
