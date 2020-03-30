import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/env-paths";
import envPaths, { Paths } from "env-paths";

let cli;
beforeEach(() => (cli = new Console()));

describe("PathsCommand", () => {
    it("should list all system paths", async () => {
        let message: string;
        jest.spyOn(console, "log").mockImplementationOnce((m) => (message = m));

        await cli.execute(Command);

        const paths: Paths = envPaths("ark", { suffix: "core" });

        expect(message).toContain(paths.cache);
        expect(message).toContain(paths.config);
        expect(message).toContain(paths.data);
        expect(message).toContain(paths.log);
        expect(message).toContain(paths.temp);
    });
});
