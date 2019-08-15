import { Support } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { WinstonLogger } from "./driver";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(
            "logger",
            this.app.resolve<LoggerManager>("log-manager").createDriver(new WinstonLogger(options)),
        );
    }

    public getDefaults(): Record<string, any> {
        return defaults;
    }

    public getManifest(): Record<string, any> {
        return require("../package.json");
    }
}
