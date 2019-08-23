import { Contracts, Support } from "@arkecosystem/core-kernel";
import { ForgerManager } from "./manager";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        const forgerManager: ForgerManager = new ForgerManager(this.config().all());

        await forgerManager.startForging(this.config().get("bip38") as string, this.config().get("password") as string);

        // Don't keep bip38 password in memory
        this.config().set("bip38", undefined);
        this.config().set("password", undefined);

        this.app.bind("forger", forgerManager);
    }

    public async dispose(): Promise<void> {
        const forger = this.app.resolve("forger");

        if (forger) {
            this.app.resolve<Contracts.Kernel.ILogger>("log").info("Stopping Forger Manager");

            return forger.stopForging();
        }
    }

    public provides(): string[] {
        return ["forger"];
    }
}
