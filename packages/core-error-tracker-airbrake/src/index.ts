import { Support, Types } from "@arkecosystem/core-kernel";
import AirBrake from "airbrake-js";
import { defaults } from "./defaults";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("errorTracker", new AirBrake(this.opts));
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
