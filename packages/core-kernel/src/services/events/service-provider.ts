import { PackageJson } from "type-fest";
import { AbstractServiceProvider } from "../../support";
import { EventDispatcher } from "./dispatcher";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app.singleton("events", EventDispatcher);
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
