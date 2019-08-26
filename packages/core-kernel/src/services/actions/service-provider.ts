import { AbstractServiceProvider } from "../../providers";
import { Actions } from "./actions";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register the service provider.
     *
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app.ioc
            .bind<Actions>("actions")
            .to(Actions)
            .inSingletonScope();
    }
}
