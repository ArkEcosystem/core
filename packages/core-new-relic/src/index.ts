import { Support, Types } from "@arkecosystem/core-kernel";
import newrelic from "newrelic";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("error-tracker", newrelic);
    }

    public getPackageJson(): Types.PackageJson {
        return require("../package.json");
    }
}
