import { Support } from "@arkecosystem/core-kernel";
import bugsnag, { Bugsnag } from "@bugsnag/js";
import { defaults } from "./defaults";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (!this.opts.apiKey || typeof this.opts.apiKey !== "string") {
            throw new Error("Bugsnag plugin config invalid");
        }

        this.app.bind("error-tracker", bugsnag(this.opts as Bugsnag.IConfig));
    }

    public getDefaults(): Record<string, any> {
        return defaults;
    }

    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
