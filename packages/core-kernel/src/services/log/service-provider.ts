import { AbstractServiceProvider } from "../../providers";
import { LogManager } from "./manager";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind<LogManager>("logManager")
            .to(LogManager)
            .inSingletonScope();

        const logManager: LogManager = this.app.get<LogManager>("logManager");
        await logManager.boot();

        // Note: Ensure that we rebind the logger that is bound to the container so IoC can do it's job.
        this.app.bind("log").toConstantValue(logManager.driver());
    }
}
