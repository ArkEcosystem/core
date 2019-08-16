import { Support, Types } from "@arkecosystem/core-kernel";
import Sentry from "@sentry/node";
import { defaults } from "./defaults";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        Sentry.init(this.opts);

        this.app.bind("error-tracker", Sentry);
    }

    public getDefaults(): Record<string, any> {
        return defaults;
    }

    public getPackageJson(): Types.PackageJson {
        return require("../package.json");
    }
}
