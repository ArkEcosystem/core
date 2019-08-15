import { Contracts, Support } from "@arkecosystem/core-kernel";
import { ConnectionManager } from "./manager";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.resolve<Contracts.Kernel.ILogger>("logger").info("Starting Database Manager");

        this.app.bind("database-manager", new ConnectionManager());
    }

    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
