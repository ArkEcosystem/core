import { Support } from "@arkecosystem/core-kernel";
import { Blockchain } from "./blockchain";
import { config } from "./config";
import { defaults } from "./defaults";
import { stateStorage } from "./state-storage";

export class ServiceProvider extends Support.AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        const blockchain = new Blockchain(this.opts);

        config.init(this.opts);

        this.app.bind("state", stateStorage);

        if (!process.env.CORE_SKIP_BLOCKCHAIN) {
            await blockchain.start();
        }

        this.app.bind(this.getAlias(), blockchain);
    }

    /**
     * Dispose any application services.
     */
    public async dispose(): Promise<void> {
        await this.app.resolve<Blockchain>(this.getAlias()).stop();
    }

    /**
     * The default options of the plugin.
     */
    public getDefaults(): Record<string, any> {
        return defaults;
    }

    /**
     * The manifest of the plugin.
     */
    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
