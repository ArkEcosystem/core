import { AbstractServiceProvider } from "../../providers";
import { Actions } from "./actions";
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
            .bind<Actions>(Identifiers.ActionService)
            .to(Actions)
            .inSingletonScope();
    }
}
