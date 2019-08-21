import { Contracts, Support, Types } from "@arkecosystem/core-kernel";
import { ConnectionManager } from "./manager";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.resolve<Contracts.Kernel.ILogger>("log").info("Starting Database Manager");

        this.app.singleton("database-manager", ConnectionManager);
    }

    public getPackageJson(): Types.PackageJson {
        return require("../package.json");
    }
}
