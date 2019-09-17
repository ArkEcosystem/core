import { Providers } from "@arkecosystem/core-kernel";

import { ForgerManager } from "./manager";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        const forgerManager: ForgerManager = this.app.resolve<ForgerManager>(ForgerManager);

        forgerManager.init(this.config().all());

        await forgerManager.startForging(this.config().get("bip38"), this.config().get("password"));

        // Don't keep bip38 password in memory
        this.config().set("bip38", undefined);
        this.config().set("password", undefined);

        this.app.bind("forger").toConstantValue(forgerManager);
    }

    public async dispose(): Promise<void> {
        this.app.log.info("Stopping Forger Manager");

        return this.app.get<ForgerManager>("forger").stopForging();
    }
}
