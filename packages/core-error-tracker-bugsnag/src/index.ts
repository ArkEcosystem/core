import { Support, Types } from "@arkecosystem/core-kernel";
import bugsnag, { Bugsnag } from "@bugsnag/js";
import { defaults } from "./defaults";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        if (!this.opts.apiKey || typeof this.opts.apiKey !== "string") {
            throw new Error("Bugsnag plugin config invalid");
        }

        this.app.bind("errorTracker", bugsnag(this.opts as Bugsnag.IConfig));
    }

    public manifest(): Types.PackageJson {
        return require("../package.json");
    }

    public configDefaults(): Types.ConfigObject {
        return defaults;
    }

    public provides(): string[] {
        return ["errorTracker"];
    }
}
