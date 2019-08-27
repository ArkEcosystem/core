import { Services, Providers, Container } from "@arkecosystem/core-kernel";
import { SignaleLogger } from "./driver";

export class ServiceProvider extends Providers.AbstractServiceProvider {
    public async register(): Promise<void> {
        const logManager: Services.Log.LogManager = this.app.get<Services.Log.LogManager>(Container.Identifiers.LogManager);
        await logManager.extend("signale", async () => new SignaleLogger(this.config()).make());
        logManager.setDefaultDriver("signale");

        // Note: Ensure that we rebind the logger that is bound to the container so IoC can do it's job.
        this.app.unbind(Container.Identifiers.LogService);
        this.app.bind(Container.Identifiers.LogService).toConstantValue(logManager.driver());
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
