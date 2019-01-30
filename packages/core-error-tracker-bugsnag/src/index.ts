import { AbstractServiceProvider } from "@arkecosystem/core-container";
import bugsnag from "@bugsnag/js";
import { defaults } from "./defaults";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        return bugsnag(options);
    }

    public getAlias(): string {
        return "error-tracker";
    }
}
