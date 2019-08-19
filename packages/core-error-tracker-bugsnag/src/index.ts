import { Support, Types } from "@arkecosystem/core-kernel";
import bugsnag, { Bugsnag } from "@bugsnag/js";
import { defaults } from "./defaults";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (!this.opts.apiKey || typeof this.opts.apiKey !== "string") {
            throw new Error("Bugsnag plugin config invalid");
        }

        this.app.bind("error-tracker", bugsnag(this.opts as Bugsnag.IConfig));
    }

    public getDefaults(): Types.ConfigObject {
        return defaults;
    }

    public getPackageJson(): Types.PackageJson {
        return require("../package.json");
    }
}
