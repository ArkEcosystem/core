import { AbstractServiceProvider } from "../../providers";
import { LogManager } from "./manager";
import { Identifiers } from "../../container";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind<LogManager>(Identifiers.LogManager)
            .to(LogManager)
            .inSingletonScope();

        const logManager: LogManager = this.app.get<LogManager>(Identifiers.LogManager);
        await logManager.boot();

        // Note: Ensure that we rebind the logger that is bound to the container so IoC can do it's job.
        this.app.bind(Identifiers.LogService).toConstantValue(logManager.driver());
    }
}
