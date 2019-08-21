import { PackageJson } from "type-fest";
import { AbstractServiceProvider } from "../../support";
import { LogManager } from "./manager";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app.singleton<LogManager>("logManager", LogManager);

        // Note: Ensure that we rebind the logger that is bound to the container so IoC can do it's job.
        this.app.bind("log", await this.app.resolve<LogManager>("logManager").driver());
    }

    /**
     * Get the manifest of the service provider.
     *
     * @returns {PackageJson}
     * @memberof ServiceProvider
     */
    public getPackageJson(): PackageJson {
        return {};
    }
}
