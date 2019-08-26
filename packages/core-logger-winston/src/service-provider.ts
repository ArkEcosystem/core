import { Services, Support } from "@arkecosystem/core-kernel";
import { WinstonLogger } from "./driver";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        const logManager: Services.Log.LogManager = this.ioc.get<Services.Log.LogManager>("logManager");
        await logManager.extend("winston", async () => new WinstonLogger(this.config()).make());
        logManager.setDefaultDriver("winston");

        // Note: Ensure that we rebind the logger that is bound to the container so IoC can do it's job.
        this.ioc.unbind("log");
        this.ioc.bind("log").toConstantValue(logManager.driver());
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
