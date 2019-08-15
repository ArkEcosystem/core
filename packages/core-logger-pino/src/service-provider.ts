import { Support } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { PinoLogger } from "./driver";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("logger", this.app.resolve<LoggerManager>("log-manager").createDriver(new PinoLogger(options)));
    }

    public getDefaults(): Record<string, any> {
        return defaults;
    }

    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
