import { dirSync, setGracefulCleanup } from "tmp";

import { configManager } from "@packages/core/src/common/config";
import { init } from "@packages/core/src/hooks/init/config";

afterAll(() => setGracefulCleanup());

describe("init", () => {
    it("should load the configuration", async () => {
        // @ts-ignore
        await init({ config: { configDir: dirSync().name, version: "3.0.0", bin: "ark" } });

        expect(configManager.get("token")).toBe("ark");
        expect(configManager.get("channel")).toBe("latest");
    });

    it("should on first start set the channel to [next] if the version contains [-next.X]", async () => {
        // @ts-ignore
        await init({ config: { configDir: dirSync().name, version: "3.0.0-next.1", bin: "ark" } });

        expect(configManager.get("token")).toBe("ark");
        expect(configManager.get("channel")).toBe("next");
    });

    it("should on post-first start set the channel to [next] if the version contains [-next.X]", async () => {
        const configDir: string = dirSync().name;

        const spySet = jest.spyOn(configManager, "set");

        // @ts-ignore
        await init({ config: { configDir, version: "3.0.0", bin: "ark" } });

        expect(configManager.get("token")).toBe("ark");
        expect(configManager.get("channel")).toBe("latest");

        // @ts-ignore
        await init({ config: { configDir, version: "3.0.0-next.1", bin: "ark" } });

        expect(configManager.get("token")).toBe("ark");
        expect(configManager.get("channel")).toBe("next");

        expect(spySet).toHaveBeenLastCalledWith("channel", "next");
    });
});
