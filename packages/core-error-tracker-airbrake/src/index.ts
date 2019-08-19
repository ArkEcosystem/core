import { Support, Types } from "@arkecosystem/core-kernel";
import AirBrake from "airbrake-js";
import { defaults } from "./defaults";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("error-tracker", new AirBrake(this.opts));
    }

    public getDefaults(): Types.ConfigObject {
        return defaults;
    }

    public getPackageJson(): Types.PackageJson {
        return require("../package.json");
    }
}
