import { Support } from "@arkecosystem/core-kernel";
import pluralize from "pluralize";
import { defaults } from "./defaults";
import { ForgerManager } from "./manager";

export class ServiceProvider extends Support.AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        const forgerManager = new ForgerManager(this.opts);
        const forgers = await forgerManager.loadDelegates(this.opts.bip38, this.opts.password);

        if (!forgers) {
            this.app.logger.info("Forger is disabled :grey_exclamation:");
            return;
        }

        // Don't keep bip38 password in memory
        delete process.env.CORE_FORGER_PASSWORD;
        delete this.opts.password;

        this.app.logger.info(`Forger Manager started with ${pluralize("forger", forgers.length, true)}`);

        forgerManager.startForging();
    }

    /**
     * Dispose any application services.
     */
    public async dispose(): Promise<void> {
        this.app.logger.info("Stopping Forger Manager");

        await this.app.resolve("forger").stop();
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
