import { Support } from "@arkecosystem/core-kernel";
import newrelic from "newrelic";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("error-tracker", newrelic);
    }

    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
