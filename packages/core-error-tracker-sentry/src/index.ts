import { Support, Types } from "@arkecosystem/core-kernel";
import Sentry from "@sentry/node";
import { defaults } from "./defaults";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        Sentry.init(this.opts);

        this.app.bind("errorTracker", Sentry);
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
