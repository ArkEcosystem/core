import { Contracts, Support, Types } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { ForgerManager } from "./manager";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        const forgerManager: ForgerManager = new ForgerManager(this.opts);

        await forgerManager.startForging(this.opts.bip38 as string, this.opts.password as string);

        // Don't keep bip38 password in memory
        delete this.opts.bip38;
        delete this.opts.password;

        this.app.bind("forger", forgerManager);
    }

    public async dispose(): Promise<void> {
        const forger = this.app.resolve("forger");

        if (forger) {
            this.app.resolve<Contracts.Kernel.ILogger>("log").info("Stopping Forger Manager");

            return forger.stopForging();
        }
    }

    public manifest(): Types.PackageJson {
        return require("../package.json");
    }

    public defaults(): Types.ConfigObject {
        return defaults;
    }

    public provides(): string[] {
        return ["forger"];
    }
}
