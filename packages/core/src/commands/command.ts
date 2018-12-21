import { resolve } from "path";

export abstract class AbstractCommand {
    constructor(readonly options: any) {}

    protected async buildApplication(app, options) {
        const modifiers: any = { skipPlugins: this.options.skipPlugins };

        if (this.options.preset) {
            modifiers.preset = resolve(__dirname, `../presets/${this.options.preset}`);
        }

        await app.setUp(this.options.parent._version, this.options, { ...modifiers, ...options });

        return app;
    }

    protected buildPeerOptions(options) {
        const config = {
            networkStart: options.networkStart,
            disableDiscovery: options.disableDiscovery,
            skipDiscovery: options.skipDiscovery,
            ignoreMinimumNetworkReach: options.ignoreMinimumNetworkReach,
        };

        if (options.launchMode === "seed") {
            config.skipDiscovery = true;
            config.ignoreMinimumNetworkReach = true;
        }

        return config;
    }

    protected isInterface(): boolean {
        return !this.isInteractive();
    }

    protected isInteractive(): boolean {
        return !!this.options.interactive;
    }
}
