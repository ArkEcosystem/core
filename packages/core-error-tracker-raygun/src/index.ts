import { Support } from "@arkecosystem/core-kernel";
import raygun from "raygun";
import { defaults } from "./defaults";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("error-tracker", new raygun.Client().init((this.opts as unknown) as raygun.raygun.RaygunOptions));
    }

    public getDefaults(): Record<string, any> {
        return defaults;
    }

    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
