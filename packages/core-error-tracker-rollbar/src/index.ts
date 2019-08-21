import { Support, Types } from "@arkecosystem/core-kernel";
import Rollbar from "rollbar";
import { defaults } from "./defaults";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("errorTracker", new Rollbar(this.opts));
    }

    public manifest(): Types.PackageJson {
        return require("../package.json");
    }

    public defaults(): Types.ConfigObject {
        return defaults;
    }

    public provides(): string[] {
        return ["errorTracker"];
    }
}
