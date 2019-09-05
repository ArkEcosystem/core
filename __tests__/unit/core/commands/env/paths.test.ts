import envPaths, { Paths } from "env-paths";

import { PathsCommand } from "@packages/core/src/commands/env/paths";

describe("PathsCommand", () => {
    it("should list all system paths", async () => {
        let message: string;
        jest.spyOn(console, "log").mockImplementationOnce(m => (message = m));

        await PathsCommand.run(["--token=ark", "--network=mainnet"]);

        const paths: Paths = envPaths("ark", { suffix: "core" });

        expect(message).toContain(paths.cache);
        expect(message).toContain(paths.config);
        expect(message).toContain(paths.data);
        expect(message).toContain(paths.log);
        expect(message).toContain(paths.temp);
    });
});
