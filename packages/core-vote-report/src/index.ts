import { Support, Types } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { startServer } from "./server";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("vote-report", startServer(this.opts));
        this.app.bind("vote-report.options", this.opts);
    }

    public async dispose(): Promise<void> {
        await this.app.resolve("vote-report").stop();
    }

    public getDefaults(): Types.ConfigObject {
        return defaults;
    }

    public getPackageJson(): Types.PackageJson {
        return require("../package.json");
    }
}
