import Command, { flags } from "@oclif/command";
import { resolve } from "path";

// tslint:disable-next-line:no-default-export
export default abstract class extends Command {
    public static flagsNetwork = {
        data: flags.string({
            char: "d",
            description: "...",
        }),
        config: flags.string({
            char: "c",
            description: "...",
        }),
        network: flags.string({
            char: "n",
            description: "...",
        }),
    };

    public static flagsBehaviour = {
        networkStart: flags.string({
            char: "d",
            description: "...",
        }),
        disableDiscovery: flags.string({
            char: "c",
            description: "...",
        }),
        skipDiscovery: flags.string({
            char: "n",
            description: "...",
        }),
        ignoreMinimumNetworkReach: flags.string({
            char: "n",
            description: "...",
        }),
        launchMode: flags.string({
            char: "n",
            description: "...",
        }),
        preset: flags.string({
            char: "n",
            description: "...",
        }),
    };

    public static flagsForger = {
        bip38: flags.string({
            char: "d",
            description: "...",
        }),
        bip39: flags.string({
            char: "c",
            description: "...",
        }),
        password: flags.string({
            char: "c",
            description: "...",
        }),
    };

    protected async buildApplication(app, flags) {
        const modifiers: any = { skipPlugins: flags.skipPlugins };

        if (flags.preset) {
            modifiers.preset = resolve(__dirname, `../presets/${flags.preset}`);
        }

        await app.setUp(flags.parent._version, flags, {
            ...modifiers,
            ...flags,
        });

        return app;
    }

    protected buildPeerOptions(flags) {
        const config = {
            networkStart: flags.networkStart,
            disableDiscovery: flags.disableDiscovery,
            skipDiscovery: flags.skipDiscovery,
            ignoreMinimumNetworkReach: flags.ignoreMinimumNetworkReach,
        };

        if (flags.launchMode === "seed") {
            config.skipDiscovery = true;
            config.ignoreMinimumNetworkReach = true;
        }

        return config;
    }
}
