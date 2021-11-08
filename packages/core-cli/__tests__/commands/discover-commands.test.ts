import { Console } from "@packages/core-test-framework";
import { DiscoverCommands } from "@packages/core-cli/src/commands";
import { resolve } from "path";
import { setGracefulCleanup } from "tmp";

let cli;
let cmd;

beforeAll(() => setGracefulCleanup());

beforeEach(() => {
    cli = new Console();

    cmd = cli.app.resolve(DiscoverCommands);
});

describe("DiscoverCommands", () => {
    describe("#within", () => {
        it("should discover commands within the given directory", () => {
            const commandPath: string = resolve(__dirname, "../../../../packages/core/dist/commands");

            const commands = cmd.within(commandPath);

            expect(commands).toBeObject();
            expect(commands).not.toBeEmpty();
        });
    });

    describe("#from", () => {
        it("should not discover commands if no packages are passed in", () => {
            const commands = cmd.from([]);

            expect(commands).toBeObject();
            expect(commands).toBeEmpty();
        });

        it("should discover commands within the given packages", () => {
            const commandPath: string = resolve(__dirname, "./dist");

            const commands = cmd.from([commandPath]);

            expect(commands).toBeObject();
            expect(commands).toContainAllKeys(["help"]);
        });
    });
});
