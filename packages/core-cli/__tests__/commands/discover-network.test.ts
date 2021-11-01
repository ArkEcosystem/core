import { Console } from "@arkecosystem/core-test-framework";
import { DiscoverNetwork } from "@packages/core-cli/src/commands";
import { ensureDirSync } from "fs-extra";
import prompts from "prompts";
import { dirSync, setGracefulCleanup } from "tmp";

let cli;
let cmd;
let configPath;

beforeAll(() => setGracefulCleanup());

beforeEach(() => {
    cli = new Console();

    cmd = cli.app.resolve(DiscoverNetwork);

    configPath = dirSync().name;
});

describe("DiscoverNetwork", () => {
    it("should throw if no configurations can be detected", async () => {
        await expect(cmd.discover(configPath)).rejects.toThrow();
    });

    it("should choose the first network if only a single network is found", async () => {
        ensureDirSync(`${configPath}/mainnet`);

        await expect(cmd.discover(configPath)).resolves.toBe("mainnet");
    });

    it("should throw if the given path does not exist", async () => {
        await expect(cmd.discover("does-not-exist")).rejects.toThrow("The [does-not-exist] directory does not exist.");
    });

    it("should choose the selected network if multiple networks are found", async () => {
        ensureDirSync(`${configPath}/mainnet`);
        ensureDirSync(`${configPath}/devnet`);

        prompts.inject(["devnet", true]);

        await expect(cmd.discover(configPath)).resolves.toBe("devnet");
    });

    it("should throw if multiple networks are found && skipPrompts = false", async () => {
        ensureDirSync(`${configPath}/mainnet`);
        ensureDirSync(`${configPath}/devnet`);

        await expect(cmd.discover(configPath, false)).rejects.toThrow(`Cannot determine network from directory [${configPath}]`);

    });

    it("should throw if the network selection is not confirmed", async () => {
        ensureDirSync(`${configPath}/mainnet`);
        ensureDirSync(`${configPath}/devnet`);

        prompts.inject(["devnet", false]);

        await expect(cmd.discover(configPath)).rejects.toThrow("You'll need to confirm the network to continue.");
    });

    it("should throw if the network selection is not valid", async () => {
        ensureDirSync(`${configPath}/mainnet`);
        ensureDirSync(`${configPath}/devnet`);

        prompts.inject(["randomnet", true]);

        await expect(cmd.discover(configPath)).rejects.toThrow(`The given network "randomnet" is not valid.`);
    });
});
